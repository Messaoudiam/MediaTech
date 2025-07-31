// nestjs
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { CONFIG } from './config/app.config';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Activer les logs détaillés
  logger.log("Démarrage de l'application avec logs détaillés");

  // Créer l'application NestJS
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Activer tous les niveaux de log
  });

  const configService = app.get(ConfigService);

  // Sécurité
  logger.log('Configuration de la sécurité (helmet)');
  app.use(helmet(CONFIG.security.helmet));

  // Cookie Parser
  logger.log('Configuration du middleware cookie-parser');
  app.use(cookieParser());

  // Préfixe global pour toutes les routes API
  logger.log('Configuration du préfixe global /api');
  app.setGlobalPrefix('api');

  // Configuration de Swagger
  logger.log('Configuration de Swagger pour la documentation API');
  const config = new DocumentBuilder()
    .setTitle('API Fullstack')
    .setDescription(
      `
    ## Documentation de l'API pour le projet fullstack
    
    Cette API fournit un système complet d'authentification et de gestion utilisateurs.
    
    ### Fonctionnalités principales
    - Inscription et connexion d'utilisateurs
    - Gestion de profil
    - Authentification via JWT (Bearer token + cookies)
    
    ### Authentification
    Les endpoints protégés nécessitent un Bearer token qui doit être fourni dans l'en-tête Authorization.
    Certains endpoints utilisent aussi des cookies pour la persistance de session.
    `,
    )
    .setVersion('1.0')
    .setContact('Administrateur', 'https://votre-site.com', 'admin@example.com')
    .setLicense('License', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Serveur de développement')
    .addServer('https://api.production.com', 'Serveur de production')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Entrez votre JWT token',
      },
      'access-token',
    )
    .addCookieAuth(
      'refresh_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
      },
      'refresh-token',
    )
    .addTag(
      'Authentification',
      "Endpoints pour l'authentification et la gestion de session",
    )
    .addTag('Utilisateurs', 'Endpoints pour la gestion des utilisateurs')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
    extraModels: [],
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    },
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-material.css',
  });

  logger.log('Configuration de CORS pour autoriser les cookies...');

  // CORS
  app.enableCors({
    origin: ['http://localhost:4200', 'https://my-library.cloud'], // Frontend Angular
    credentials: true, // Important pour les cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Pipes de validation
  logger.log('Configuration des pipes de validation');
  app.useGlobalPipes(new ValidationPipe(CONFIG.validation));

  // Démarrage du serveur sur localhost (IPv4) explicitement
  const port = configService.get('PORT') || 3000;

  logger.log('Démarrage du serveur sur localhost...');
  await app.listen(port, 'localhost');

  logger.log(`Application démarrée sur http://localhost:${port}`);
  logger.log(
    `Documentation API disponible sur http://localhost:${port}/api/docs`,
  );
}

// Démarrage de l'application
bootstrap().catch((err) => {
  console.error("Erreur lors du démarrage de l'application:", err);
});
