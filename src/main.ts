import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
// import { TransformInterceptor } from './shared/interceptor/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase payload size limit for image uploads (base64 encoded images can be large)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  // app.useGlobalInterceptors(new TransformInterceptor());

  // Configure CORS for both development and production
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',  // Vite default
      'http://127.0.0.1:5500',  // Live Server
      /^http:\/\/localhost:\d+$/, // Any localhost port
      /^http:\/\/127\.0\.0\.1:\d+$/, // Any 127.0.0.1 port
      'https://nbox-ai.tech',   // Production domain
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });


  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
