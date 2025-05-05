import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Récupère les informations détaillées sur l'état du système
   */
  async getHealthInfo() {
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
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        app: {
          name: 'Mon Projet Fullstack API',
          version: this.configService.get('npm_package_version', 'n/a'),
          nodeVersion: process.version,
          environment: this.configService.get('NODE_ENV', 'development'),
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
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des données de santé',
        error,
      );
      return {
        status: 'error',
        message: 'Impossible de récupérer les données de santé',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
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
