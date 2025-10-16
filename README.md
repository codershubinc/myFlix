[![wakatime](https://wakatime.com/badge/user/c8cd0c53-219b-4950-8025-0e666e97e8c8/project/0b52adb2-0737-4631-8d72-3ef44a856246.svg)](https://wakatime.com/badge/user/c8cd0c53-219b-4950-8025-0e666e97e8c8/project/0b52adb2-0737-4631-8d72-3ef44a856246)

# Video Streaming App

## Overview

This project is a local video streaming server built with NestJS and MongoDB. It supports:

- Movie upload (large files, metadata)
- Video streaming with range requests
- Movie metadata management
- Directory listing
- Device connection logging

## Architecture Diagram

```mermaid
graph TD
  subgraph Client
    A[Browser/Frontend]
  end
  subgraph Server
    B[NestJS App]
    B1[MoviesController]
    B2[StreamingController]
    B3[UploadController]
    B4[Static File Server]
    B5[Config/Utils]
  end
  subgraph Database
    C[(MongoDB)]
  end
  A -- HTTP/REST/Multipart --> B
  B1 -- CRUD Movies --> C
  B2 -- Stream Video --> A
  B3 -- Upload File --> C
  B4 -- Serve HTML/JS/CSS --> A
  B5 -- Movie Metadata/Config --> C
  B -- Logging/Analytics --> B5
```

## Key Features

- Upload and stream large video files
- Store and manage movie metadata
- List movies from configured directories
- Secure and extensible backend

## Getting Started

1. Install dependencies: `bun install` or `npm install`
2. Start the server: `bun run start` or `npm run start`
3. Access endpoints via browser or API client

## Technologies Used

- NestJS (TypeScript)
- MongoDB (Mongoose)
- Multer (file uploads)
- Docker (optional)

## Endpoints

- `GET /stream/movies/list` — List movies
- `POST /stream/upload/` — Upload movie file
- `GET /stream/movies/stream` — Stream movie file

## Notes

- For large uploads, chunked upload is recommended for production
- All paths and configs can be customized
- See source code for more details
