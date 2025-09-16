import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { spawn } from 'child_process';
import { join } from 'path';

@Injectable()
export class StreamingService {
    private readonly logger = new Logger(StreamingService.name);

    async streamVideoWithFfmpeg(filename: string, res: Response) {
        const videoPath = join(process.cwd(), 'videos', filename);

        // FFmpeg arguments for on-the-fly transcoding
        const ffmpegArgs = [
            '-i', videoPath,         // Input file
            '-c:v', 'libx264',        // Video codec: H.264
            '-c:a', 'aac',            // Audio codec: AAC
            '-movflags', 'frag_keyframe+empty_moov', // Optimizes for streaming
            '-f', 'mp4',              // Output format: MP4 container
            'pipe:1',                 // Output to stdout
        ];

        // Spawn the FFmpeg process
        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

        // Set the proper headers for video streaming
        res.setHeader('Content-Type', 'video/mp4');

        // Pipe the FFmpeg's stdout to the response
        ffmpegProcess.stdout.pipe(res);

        // Log any errors from FFmpeg
        ffmpegProcess.stderr.on('data', (data) => {
            this.logger.error(`FFmpeg stderr: ${data}`);
        });

        // Handle the process closing
        ffmpegProcess.on('close', (code) => {
            if (code !== 0) {
                this.logger.log(`FFmpeg process exited with code ${code}`);
            }
            res.end(); // End the response when FFmpeg finishes
        });

        // Handle client closing the connection
        res.on('close', () => {
            this.logger.log('Client closed connection. Killing FFmpeg process.');
            ffmpegProcess.kill();
        });
    }
}