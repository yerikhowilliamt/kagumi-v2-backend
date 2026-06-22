import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'multer';
import cookieParser = require('cookie-parser');
import dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 4015;
  app.use(cookieParser('token'));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Kagumi API')
    .setDescription('The Kagumi v2 API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup('api/docs', app, documentFactory);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,POST, PATCH, PUT,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap().catch((err) => {
  console.error('An error occurred:', err);
  process.exit(1);
});
