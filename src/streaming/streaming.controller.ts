import { Controller, Get, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';

@Controller('stream')
export class StreamingController {
    @Get('movie')
    streamVideo(@Req() req: Request, @Res() res: Response) {

        // Device information
        console.log('Request Headers:', req.headers);


        // Path to your single video file
        const videoPath = join(process.cwd(), 'src/streaming/1.mkv');

        // Check if the video file exists
        try {
            statSync(videoPath);
        } catch (error) {
            return res.status(HttpStatus.NOT_FOUND).send('Video not found.');
        }

        const { size } = statSync(videoPath);
        const range = req.headers.range;

        // A browser will send a 'Range' header to request a chunk of the video.
        // If it doesn't exist, the browser isn't asking for a stream.
        if (!range) {
            return res.status(HttpStatus.BAD_REQUEST).send('Requires Range header');
        }

        // 1. Parse the range header
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
        const chunkSize = (end - start) + 1;

        // 2. Create a read stream for the requested chunk
        const videoStream = createReadStream(videoPath, { start, end });

        // 3. Set the necessary headers for a 206 Partial Content response
        res.writeHead(HttpStatus.PARTIAL_CONTENT, {
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        });

        // 4. Pipe the video chunk to the response
        videoStream.pipe(res);
    }
}