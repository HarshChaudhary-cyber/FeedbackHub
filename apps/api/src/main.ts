import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('FeedbackHub API')
    .setDescription('FeedbackHub Central REST API Gateway')
    .setVersion('0.1.0')
    .addTag('Health', 'System health and status verification')
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
