import { Controller, Get, Req, Res, } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { createStream, createStreamWithFfmpeg } from 'src/utils/createStream';

@Controller('stream')
export class StreamingController {
    @Get('/')
    streamMovie(@Res() res: Response, @Req() req: Request) {
        return createStream(res, req);
    }
    @Get('/f')
    streamMovieWithFfmpeg(@Res() res: Response, @Req() req: Request) {
        return createStreamWithFfmpeg(res, req);
    } 
}