import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/moviesDB');

import { MovieModel } from './movies.schema';

export const moviesConfig = {
    async createConfig(data: any) {
        const doc = new MovieModel(data);
        return await doc.save();
    },

    async getConfig(id: string) {
        return await MovieModel.findById(id).exec();
    }
};