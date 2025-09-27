import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.enableCors(); // Enable CORS for all origins - adjust as needed
    
    // Serve static files from the public directory
    app.useStaticAssets(join(__dirname, '..', 'public'));
    
    await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
    const appUrl = await app.getUrl( ).catch(() => 'err http://localhost:3001');
    console.log('Starting server on port', process.env.PORT ?? 3001, 'uri', appUrl);
  } catch (error) {
    console.error('Error starting server:', error);
  }

}
bootstrap();
