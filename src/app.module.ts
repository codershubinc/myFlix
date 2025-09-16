// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreamingController } from './streaming/streaming.controller'; // Import it

@Module({
  imports: [],
  controllers: [AppController, StreamingController], // Add it here
  providers: [AppService],
})
export class AppModule {}