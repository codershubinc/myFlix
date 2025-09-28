import type { Request, Response } from "express";
import { createReadStream, statSync } from "fs";
import { HttpStatus } from "@nestjs/common";

export function createStream(
    res: Response,
    req: Request
) {
    const videoPath = req.query.path as string;
    if (!videoPath) {
        res.status(HttpStatus.BAD_REQUEST).send('No video path specified');
        return;
    }
    let fileSize = 0;
    try {
        fileSize = statSync(videoPath).size;
    } catch (err) {
        res.status(HttpStatus.NOT_FOUND).send('Video not found');
        return;
    }
    const range = req.headers['range'];
    if (!range) {
        res.status(HttpStatus.BAD_REQUEST).send('Requires Range header');
        return;
    }
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = (end - start) + 1;
    const videoStream = createReadStream(videoPath, { start, end });
    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
    });
    videoStream.pipe(res);
} 