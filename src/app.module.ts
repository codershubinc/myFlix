// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { modules } from './index.module';

@Module({
  imports: [
    ...modules
  ],
  controllers: [AppController,], // Add it here
  providers: [
    AppService,
  ],
  exports: [],
})
export class AppModule { }