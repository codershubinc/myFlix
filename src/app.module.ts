// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreamingController } from './streaming/streaming.controller'; // Import it 
import { ThrottlerGuard, ThrottlerModule } from 'nestjs-throttler';
import { APP_GUARD } from '@nestjs/core';
import { MoviesModule } from './movies/movies.module';
import { MoviesController } from './movies/movies.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 10000, // 10 seconds in milliseconds
      limit: 30, // 30 requests per 10 seconds
    }),
  ],
  controllers: [AppController, StreamingController, MoviesController], // Add it here
  providers: [
    AppService,
  ],
  exports: [],
})
export class AppModule { }