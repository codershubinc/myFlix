import { Schema, Document, model, ObjectId } from 'mongoose';
 

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