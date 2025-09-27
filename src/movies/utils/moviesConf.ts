import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/movies');

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