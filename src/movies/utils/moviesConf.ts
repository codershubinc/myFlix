import { MovieModel } from './movies.schema';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import type { Request } from 'express';
dotenv.config();

// MongoDB connection with proper error handling
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/movies';
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // Don't throw here - this would crash the app
        // Instead, handle DB errors in each operation
    });


export const moviesConfig = {
    async createConfig(req: Request, filePath: string) {
        try {
            const { title, description, releaseDate, genres, duration, director, cast, language, country, rating, tags, fileSize, format, thumbnailPath } = req.body;
            const doc = new MovieModel({
                title,
                description,
                releaseDate,
                genres,
                duration,
                director,
                cast,
                language,
                country,
                rating,
                tags,
                filePath,
                fileSize,
                format,
                thumbnailPath
            });
            return await doc.save();
        } catch (error) {
            console.error('Error creating movie config:', error);
            throw error; // Re-throw so the controller can handle it
        }
    },

    async getConfig(id: string) {
        try {
            return await MovieModel.findById(id).exec();
        } catch (error) {
            console.error(`Error getting movie config for ID ${id}:`, error);
            throw error;
        }
    },

    async updateConfig(id: string, data: any) {
        try {
            return await MovieModel.findByIdAndUpdate(id, data, { new: true }).exec();
        } catch (error) {
            console.error(`Error updating movie config for ID ${id}:`, error);
            throw error;
        }
    },

    async deleteConfig(id: string) {
        try {
            return await MovieModel.findByIdAndDelete(id).exec();
        } catch (error) {
            console.error(`Error deleting movie config for ID ${id}:`, error);
            throw error;
        }
    }
};