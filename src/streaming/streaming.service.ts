import { Injectable, Logger } from '@nestjs/common'; 
import ffmpegService from '../utils/ffmpeg';

@Injectable()
export class StreamingService {
    private readonly logger = new Logger(StreamingService.name);
}