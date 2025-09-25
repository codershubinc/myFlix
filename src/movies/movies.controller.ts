import { Controller, Get, HttpStatus, Post, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { mkdirSync, statSync, createReadStream } from "fs";
import { diskStorage } from "multer";
import type { Request, Response } from "express"; 
import { getAvailableAssets } from "src/utils/getAvailableAssets";


@Controller('movies')
export class MoviesController {

    @Get('list')
    async listMovies(@Res() res: Response) { 
        const availableAssetsObj: Record<string, any> = {};
        availableAssetsObj['MVS'] = await getAvailableAssets('/media/swap/MVS/MVS');
        availableAssetsObj['TestUploads'] = await getAvailableAssets('/media/swap/MVS/testUploads');
        res.status(HttpStatus.OK).json(availableAssetsObj);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req: Request, file, cb) => {
                const uploadPath = (req.query.path as string);
                try {
                    mkdirSync(uploadPath, { recursive: true });
                    cb(null, uploadPath);
                } catch (error) {
                    cb(error as Error, uploadPath);
                }
            },
            filename: (req, file, cb) => {
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
        if (!file) {
            res.status(HttpStatus.BAD_REQUEST).json({ message: 'No file uploaded' });
            return;
        }
        if (!path) {
            res.status(HttpStatus.BAD_REQUEST).json({ message: 'No path specified' });
            return;
        }
        try {
            res.status(HttpStatus.OK).json({
                message: 'File uploaded successfully',
                filename: file.originalname,
                size: file.size,
                path: `${path}/${file.originalname}`
            });
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Error handling file upload',
                error: error.message
            });
        }
    }

    @Get('stream')
    streamMovie(@Res() res: Response, @Req() req: Request) {
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
}