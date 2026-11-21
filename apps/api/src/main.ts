import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const clientOrigin = process.env.APP_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [clientOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('FeedbackHub API')
    .setDescription('FeedbackHub Central REST API Gateway & Authentication Services')
    .setVersion('0.1.0')
    .addTag('Health', 'System health and status verification')
    .addTag('Authentication', 'User registration, login, session, and account management')
    .addTag('Companies', 'Company organization creation and membership listing')
    .addTag('Tenant', 'Tenant organization context, members, and membership lifecycle')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`FeedbackHub API running at: http://localhost:${port}/api/v1`);
  console.log(`Swagger documentation at: http://localhost:${port}/api/docs`);
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}
