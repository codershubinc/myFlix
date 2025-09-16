import { Controller, Get, Req, Res, HttpStatus, Param } from '@nestjs/common';
import { spawn } from 'child_process';
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
        const videoPath = join('/home/swap/Downloads/AQMB8mSwyAb35TeNtUe0yuqRmSwgMdDV_LTSEOFuMUyr5lLxwXE68V4Pvp2iLrnP-r10rLrk-Ccl8b144WwZnNd5.mp4');

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
    @Get('movies/list')
    listMovies(@Res() res: Response) {
        // Logic to list available movies
        const mvs = spawn('find' , ['/home/swap/Downloads', '-type', 'f', '-name', '*.mkv']);
        const movies: string[] = [];
        mvs.stdout.on('data', (data) => {
            console.log(`Movies found: ${data}`);
            
            const files  = data.toString().split('\n').filter((file) => file.trim() !== '');
            movies.push(...files);
        });

        mvs.stderr.on('data', (data) => {
            console.error(`Error listing movies: ${data}`);
        });

        mvs.on('close', (code) => {
            if (code !== 0) {
                console.error(`find process exited with code ${code}`);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error listing movies');
            }
            res.json(movies);
        });

        // In case the process ends before we send the response
        if (movies.length > 0) {
            res.json(movies);
        }
    }
    @Get('movies/stream/:filename')
    streamMovie(@Param('filename') filename: string, @Res() res: Response , @Req() req: Request) {
        const videoPath = join('/home/swap/Downloads', filename);
        const stat = statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (!range) {
            return res.status(HttpStatus.BAD_REQUEST).send('Requires Range header');
        }

        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        const videoStream = createReadStream(videoPath, { start, end });
        res.writeHead(HttpStatus.PARTIAL_CONTENT, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
        });

        videoStream.pipe(res);
    }
}