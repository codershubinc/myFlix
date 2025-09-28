import { Controller, Get, HttpStatus, Post, Req, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { statSync, createReadStream } from "fs";
import type { Request, Response } from "express";
import { getAvailableAssets } from "src/utils/getAvailableAssets";
import { MulterUploadInterceptor } from "src/utils/multer";
import { createStream } from "src/utils/createStream";
import { moviesConfig } from "./utils/moviesConf";


@Controller('movies')
export class MoviesController {

    @Get('list')
    async listMovies(@Res() res: Response) {
        const availableAssetsObj: Record<string, any> = {};
        availableAssetsObj['MVS'] = await getAvailableAssets('/media/swap/MVS/MVS');
        availableAssetsObj['TestUploads'] = await getAvailableAssets('/media/swap/MVS/testUploads');
        res.status(HttpStatus.OK).json(availableAssetsObj);
    }

    @Post('/movie/d')
    @UseInterceptors(MulterUploadInterceptor('file'))
    async uploadMovie(
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any,
        @Res() res: any
    ) {
        const path = req.query.path as string;
        if (!file) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No file uploaded' });
        }
        if (!path) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No path specified' });
        }


        return res.status(HttpStatus.OK).json({
            message: 'File uploaded successfully',
            filename: file.originalname,
            size: file.size,
            path: `${path}/${file.originalname}`
        });
    }

    @Get('stream')
    streamMovie(@Res() res: Response, @Req() req: Request) {
        return createStream(res, req);
    }

    @Post('config/c')
    async createMovieConfig(@Req() req: Request, @Res() res: Response) {
        const data = req.body;
        if (!data || Object.keys(data).length === 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No data provided' });
        }
        try {
            const result = await moviesConfig.createConfig(data);
            return res.status(HttpStatus.OK).json({ message: 'Config created successfully', result });
        } catch (error) {
            console.error('Error creating movie config:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error creating config', error: error.message });
        }
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

}   