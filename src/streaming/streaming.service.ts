import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { spawn } from 'child_process';
import { join } from 'path';
import ffmpegService from '../utils/ffmpeg';

@Injectable()
export class StreamingService {
    private readonly logger = new Logger(StreamingService.name);

    async streamVideo(filename: string) {
        this.logger.log(`Streaming video: ${filename}`);
        return ffmpegService.streamVideoWithFfmpeg(filename);
    }
}