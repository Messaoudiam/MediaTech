import { Request, Response } from 'express';
import os from 'os';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Contrôleur pour les informations de santé de l'application
 */
export class HealthController {
  private prismaService: PrismaService;

  constructor() {
    this.prismaService = new PrismaService();
  }

  /**
   * Récupère les informations détaillées sur l'état du système
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      // Vérification de la connexion à la base de données
      const dbStatus = await this.checkDatabaseConnection();

      // Calcul du temps d'activité en secondes
      const uptime = process.uptime();

      // Informations sur l'utilisation mémoire
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();

      // Informations sur le système
      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        app: {
          name: 'Mon Projet Fullstack API',
          version: process.env.npm_package_version || '1.0.0',
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
        },
        system: {
          uptime: {
            seconds: uptime,
            formattedUptime: this.formatUptime(uptime),
          },
          hostname: os.hostname(),
          platform: process.platform,
          cpus: {
            count: os.cpus().length,
            model: os.cpus()[0].model,
          },
        },
        memory: {
          rss: this.formatBytes(memoryUsage.rss),
          heapTotal: this.formatBytes(memoryUsage.heapTotal),
          heapUsed: this.formatBytes(memoryUsage.heapUsed),
          external: this.formatBytes(memoryUsage.external),
          systemTotal: this.formatBytes(totalMemory),
          systemFree: this.formatBytes(freeMemory),
          systemUsage: `${Math.round(((totalMemory - freeMemory) / totalMemory) * 100)}%`,
        },
        database: dbStatus,
      };

      res.status(200).json(healthData);
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données de santé:',
        error,
      );
      res.status(500).json({
        status: 'error',
        message: 'Impossible de récupérer les données de santé',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }

  /**
   * Vérifie la connexion à la base de données
   */
  private async checkDatabaseConnection(): Promise<{
    status: string;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Vérification de la connexion à la base de données via Prisma
      await this.prismaService.$queryRaw`SELECT 1`;

      return {
        status: 'connected',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'error',
        error:
          error instanceof Error
            ? error.message
            : 'Erreur de connexion à la base de données',
      };
    }
  }

  /**
   * Formate les octets en unités lisibles (KB, MB, GB)
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formate le temps d'activité en format lisible
   */
  private formatUptime(uptime: number): string {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    return `${days}j ${hours}h ${minutes}m ${seconds}s`;
  }
}
