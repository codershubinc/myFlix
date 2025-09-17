import { join } from 'path'; 
import { spawn } from 'child_process';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FfmpegService {
    private readonly logger = new Logger(FfmpegService.name);

    /**
     * Streams a video file using FFmpeg for on-the-fly transcoding.
     * @param filename - The name of the video file to stream.
     * @param res - The Express response object to pipe the video stream to.
     */

    async streamVideoWithFfmpeg(filepath: string,) {
        const videoPath =  filepath; // Use the provided file path directly


        // FFmpeg arguments for on-the-fly transcoding
        const ffmpegArgs = [
            '-i', videoPath,         // Input file
            '-c:v', 'libx264',        // Video codec: H.264
            '-c:a', 'aac',            // Audio codec: AAC
            '-movflags', 'frag_keyframe+empty_moov', // Optimizes for streaming
            '-f', 'mp4',              // Output format: MP4 container
            'pipe:1',                 // Output to stdout
            '-preset', 'fast',        // Encoding speed/quality tradeoff
            '-tune', 'zerolatency',  // Tune for low latency
        ];

        // Spawn the FFmpeg process
        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

        ffmpegProcess.stderr.on('data', (data) => {
            this.logger.error(`FFmpeg stderr: ${data}`);
        });

        ffmpegProcess.on('close', (code) => {
            this.logger.log(`FFmpeg process exited with code ${code}`);
        });

        return ffmpegProcess.stdout;
    }
};

const ffmpegService = new FfmpegService();
export default ffmpegService;