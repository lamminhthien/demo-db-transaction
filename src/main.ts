import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Vercel
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Trust proxy for proper cookie/header handling behind Vercel's proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Orders Transaction Simulation API')
    .setDescription(
      'API for simulating transactional order creation with coupon locking and rollback scenarios.',
    )
    .setVersion('1.0')
    .addTag('orders')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDocument, {
    jsonDocumentUrl: 'api-docs-json',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
