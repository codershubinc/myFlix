import { Schema, Document, model } from 'mongoose';

export interface MovieMetadata extends Document {
    title: string;
    description?: string;
    releaseDate?: Date;
    genres?: string[];
    duration?: number;
    director?: string;
    cast?: string[];
    language?: string;
    country?: string;
    rating?: number;
    tags?: string[];
    filePath: string;
    fileSize?: number;
    format?: string;
    thumbnailPath?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const MovieSchema = new Schema<MovieMetadata>({
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

export const MovieModel = model<MovieMetadata>('Movie', MovieSchema);