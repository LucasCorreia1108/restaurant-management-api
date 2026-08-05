import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Restaurant Management API')
    .setDescription(
      'Backend for restaurant floor, kitchen and cashier operations. ' +
        'Supports JWT auth, role-based access and real-time Socket.IO events.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Users')
    .addTag('Waiters')
    .addTag('Tables')
    .addTag('Categories')
    .addTag('Menu')
    .addTag('Orders')
    .addTag('Kitchen')
    .addTag('Payments')
    .addTag('Reports')
    .addTag('Uploads')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`HTTP server running on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
  logger.log(`WebSocket namespace at ws://localhost:${port}/realtime`);
}

bootstrap();
