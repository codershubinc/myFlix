import { Controller, Get, HttpStatus, Post, Req, Res, UploadedFile, UseInterceptors, } from "@nestjs/common";
import type { Request, Response } from "express";
import { getAvailableAssets } from "src/utils/getAvailableAssets";
import { moviesConfig } from "./utils/moviesConf";
import { MulterUploadInterceptor } from "src/utils/multer";
import fs, { mkdirSync } from 'fs';

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
    @UseInterceptors(MulterUploadInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request,
        @Res() res: Response
    ) {
        const { title, path } = req.body as { title: string, path: string };
        console.log('req.body ==========================================', req.body);
        console.log('file ==========================================', file);

        if (!path || !title) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Missing title or path in body' });
        }
        console.log('file is ', file);

        // Compute new path/filename using body data
        const newPath = `${path}/${title.trim().replaceAll(' ', '_')}.${file.originalname.split('.').pop()}`;
        console.log('newPath ==========================================', newPath);

        mkdirSync(path, { recursive: true });
        fs.renameSync(file.path, newPath);

        // Respond with new file info
        return res.status(200).json({
            message: 'File uploaded and moved',
            filename: file.originalname,
            newPath,
            body: req.body,
        });
    }

    @Get('config/r/:id')
    async readMovieConfig(@Req() req: Request, @Res() res: Response) {
        const { id } = req.params;
        if (!id) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No ID provided' });
        }
        try {
            const result = await moviesConfig.getConfig(id);
            if (!result) {
                return res.status(HttpStatus.NOT_FOUND).json({ message: 'Config not found' });
            }
            return res.status(HttpStatus.OK).json({ message: 'Config retrieved successfully', result });
        } catch (error) {
            console.error('Error reading movie config:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error reading config', error: error.message });
        }
    }

    @Post('/upload')
    @UseInterceptors(MulterUploadInterceptor('file')) // saves to 'uploads/' first
    async uploadMovie(@Req() req, @Res() res) {
        const { title } = req.body;
        const file = req.file;

        // Compute new path/filename using body data
        const newPath = `/uploads/${title}_${file.originalname}`;
        fs.renameSync(file.path, newPath);

        // Respond with new file info
        return res.status(200).json({
            message: 'File uploaded and moved',
            filename: file.originalname,
            newPath,
            body: req.body,
        });
    }

}