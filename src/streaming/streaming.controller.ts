import { Controller, Get, Post, Req, Res, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { createReadStream, statSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { getAvailableAssets } from 'src/utils/getAvailableAssets';
import { logDeviceConnection } from 'src/utils/logDeviceConnection';

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
    async listMovies(@Res() res: Response,
        @Req() req: Request
    ) {
        const availableAssetsObj = {}
        const path = req.query.path as string

        if (path) return res.status(HttpStatus.OK).json(

            await getAvailableAssets(path)

        )

        const filesFromMvs = await getAvailableAssets('/media/swap/MVS/MVS');
        availableAssetsObj['MVS'] = filesFromMvs;

        const filesFromWth = await getAvailableAssets('/media/swap/WTH1');
        availableAssetsObj['WTH1'] = filesFromWth;
        const filesFromWthTestUploads = await getAvailableAssets('/media/swap/MVS/testUploads');
        availableAssetsObj['WTH1 Test Uploads'] = filesFromWthTestUploads;





        return res.status(HttpStatus.OK).json(availableAssetsObj);

    }

    @Post('upload/')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                console.log('Upload request received with query:', req.query);

                const uploadPath = (req.query.path as string);
                try {
                    // Ensure the upload directory exists
                    mkdirSync(uploadPath, { recursive: true });
                    cb(null, uploadPath);
                } catch (error) {
                    cb(error as Error, uploadPath);
                }
            },
            filename: (req, file, cb) => {
                // Keep original filename
                cb(null, file.originalname);
            },
        }),
        limits: {
            fileSize: 1024 * 1024 * 1024 * 10 // 10GB limit
        }
    }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Res() res: Response,
        @Req() req: Request
    ) {
        const path = req.query.path as string;
        console.log('Upload path:', path);

        if (!file) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No file uploaded' });
        }
        if (!path) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No path specified' });
        }
        try {
            console.log('File uploaded successfully to path:', path);

            return res.status(HttpStatus.OK).json({
                message: 'File uploaded successfully',
                filename: file.originalname,
                size: file.size,
                path: `${path}/${file.originalname}`
            });
        } catch (error) {
            console.error('Error handling file upload:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Error handling file upload',
                error: error.message
            });
        }
    }

    @Get('movies/stream')
    streamMovie(@Res() res: Response, @Req() req: Request) {
        const videoPath = req.query.path as string;
        const { size: fileSize } = statSync(videoPath);
        const range = req.headers.range;
        const currentTime = new Date().toLocaleString();
        let fileName: any = videoPath.split('/');
        fileName = fileName[fileName.length - 1];

        console.table({
            reQuestedAt: currentTime,
            fileName,
            fileSize: `${(fileSize / (1024 * 1024 * 1024) > 1) ? (fileSize / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : (fileSize / (1024 * 1024)).toFixed(2) + ' MB'}`,
            range,
            userAgent: req.headers['user-agent'] || 'Unknown',
            host: req.headers.host || 'Unknown',
            connection: req.headers.connection || 'Unknown',
            IP: req.ip ? "request IP from req.ip: " + req.ip : (req.headers['x-forwarded-for'] ? "request IP from x-forwarded-for: " + req.headers['x-forwarded-for'] : 'Unknown'),
            currentConnection: req.headers['sec-websocket-key'] ? 'WebSocket' : (req.headers['upgrade-insecure-requests'] === '1' ? 'Browser' : 'Other'),
        })

        // Log device connection for analytics
        const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'Unknown';
        const deviceName = req.headers['user-agent'] || 'Unknown';
        const movieTitle = fileName;
        logDeviceConnection(ip, deviceName, movieTitle, currentTime);
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
        console.log(`--------------------------------------------------------------------------------------`);
    }
}