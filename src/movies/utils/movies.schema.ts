import { Schema, model } from 'mongoose';
export interface Movie {
    title: string;
    description?: string;
    releaseDate?: Date;
    genres?: string[];
    duration?: number; // in minutes
    director?: string;
    cast?: string[];
    language?: string;
    country?: string;
    rating?: number; // e.g., IMDb rating
    tags?: string[];
    filePath: string; // path to the movie file
    fileSize?: number; // in bytes
    format?: string; // e.g., mp4, mkv
    thumbnailPath?: string; // path to the thumbnail image
    createdAt?: Date;
    updatedAt?: Date;
}

export const MovieSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    description: String,
    releaseDate: Date,
    genres: [String],
    duration: Number,
    director: String,
    cast: [String],
    language: String,
    country: String,
    rating: Number,
    tags: [String],
    filePath: { type: String, required: true },
    fileSize: Number,
    format: String,
    thumbnailPath: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const MovieModel = model('Movie', MovieSchema);