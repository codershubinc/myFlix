// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreamingController } from './streaming/streaming.controller'; // Import it 
import { ThrottlerGuard, ThrottlerModule } from 'nestjs-throttler';
import { APP_GUARD } from '@nestjs/core'; 

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 10000, // 10 seconds in milliseconds
      limit: 30, // 30 requests per 10 seconds
    }),
  ],
  controllers: [AppController, StreamingController], // Add it here
  providers: [
    AppService, 
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [],
})
export class AppModule { }