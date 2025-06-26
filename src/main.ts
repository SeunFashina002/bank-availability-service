import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Bank Availability Service')
    .setDescription(
      'A service that calculates and reports bank availability based on transaction data',
    )
    .setVersion('1.0')
    .addTag('banks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(
    `Bank Availability Service is running on: http://localhost:${port}`,
  );
  console.log(`API Documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
