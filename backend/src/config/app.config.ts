import { z } from 'zod';

// Validation du schéma d'environnement
export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url().or(z.string()),
    FRONTEND_URL: z
      .string()
      .url()
      .or(z.string())
      .default('http://localhost:3001'),
    JWT_SECRET: z.string().min(16, {
      message:
        'La clé JWT doit contenir au moins 16 caractères pour la sécurité',
    }),
    JWT_ACCESS_EXPIRATION: z.string().default('15m'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  })
  .transform((config) => ({
    ...config,
    // Force le format correct des URLs si nécessaire
    DATABASE_URL: config.DATABASE_URL.startsWith('postgresql://')
      ? config.DATABASE_URL
      : `postgresql://${config.DATABASE_URL}`,
    FRONTEND_URL: config.FRONTEND_URL.startsWith('http')
      ? config.FRONTEND_URL
      : `http://${config.FRONTEND_URL}`,
  }));

// Le reste du fichier reste inchangé

// Configuration globale de l'application
export const CONFIG = {
  security: {
    cors: {
      credentials: true,
    },
    helmet: {
      crossOriginEmbedderPolicy: true,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    },
    auth: {
      maxAttempts: 5,
      lockDuration: 15 * 60 * 1000, // 15 minutes
    },
  },
  validation: {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  },
  api: {
    throttle: {
      ttl: 60,
      limit: 10,
    },
  },
};

// Type pour l'environnement validé
export type Env = z.infer<typeof envSchema>;
