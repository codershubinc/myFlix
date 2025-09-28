import { MongoClient, ObjectId } from "mongodb";
import { MovieMetadata as BaseMovieMetadata } from "./movies.scema";

export interface MovieMetadata extends BaseMovieMetadata {
    _id: ObjectId;
}

class MoviesConfig {
    mongoUri = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.8';
    databaseName = 'moviesDB';
    collectionName = 'moviesCollection';

    db: MongoClient | null = null;

    async connect() {
        if (!this.db) {
            this.db = await MongoClient.connect(this.mongoUri, {});
        }
        return this.db;
    }

    async createConfig(data: MovieMetadata) {
        const client = await this.connect();
        const db = client.db(this.databaseName);
        const collection = db.collection(this.collectionName);
        const result = await collection.insertOne(data);
        return result;
    }
    async getConfig(id: string) {
        const client = await this.connect();
        const db = client.db(this.databaseName);
        const collection = db.collection(this.collectionName);
        const result = await collection.findOne({ _id: new ObjectId(id) });
        return result;
    }
}

export const moviesConfig = new MoviesConfig();