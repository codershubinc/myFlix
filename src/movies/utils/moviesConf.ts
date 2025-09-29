import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import type { Request } from 'express';
dotenv.config();
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/movies');

import { Movie, MovieModel } from './movies.schema';

export const moviesConfig = {
    async createConfig(req: Request, filePath: string) {
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
    },

    async getConfig(id: string) {
        return await MovieModel.findById(id).exec();
    },

    async updateConfig(id: string, data: any) {
        return await MovieModel.findByIdAndUpdate(id, data, { new: true }).exec();
    },

    async deleteConfig(id: string) {
        return await MovieModel.findByIdAndDelete(id).exec();
    }

};