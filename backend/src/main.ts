// nestjs
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// modules
import { AppModule } from './app.module';

// helmet
import helmet from 'helmet';
import { CONFIG } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet(CONFIG.security.helmet));

  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    ...CONFIG.security.cors,
  });

  app.useGlobalPipes(new ValidationPipe(CONFIG.validation));

  await app.listen(configService.get('PORT'));
}

bootstrap();
