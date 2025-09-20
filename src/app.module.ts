// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreamingController } from './streaming/streaming.controller'; // Import it 
import { ThrottlerGuard, ThrottlerModule } from 'nestjs-throttler';
import { APP_GUARD } from '@nestjs/core';
import { FfmpegService } from './streaming/utils/ffmpeg';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 30000, // 30 seconds in milliseconds
      limit: 30, // 30 requests per 30 seconds
    }),
  ],
  controllers: [AppController, StreamingController], // Add it here
  providers: [
    AppService,
    FfmpegService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }