import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock du service Prisma
const mockPrismaService = {
  $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
};

// Mock du service de configuration
const mockConfigService = {
  get: jest.fn((key, defaultValue) => {
    const values = {
      npm_package_version: '1.0.0',
      NODE_ENV: 'test',
    };
    return values[key] || defaultValue;
  }),
};

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthInfo', () => {
    it('should return a valid health response with database connected', async () => {
      const result = await service.getHealthInfo();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.app).toBeDefined();
      expect(result.app.name).toBe('Mon Projet Fullstack API');
      expect(result.app.version).toBe('1.0.0');
      expect(result.app.environment).toBe('test');
      expect(result.system).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.database).toBeDefined();
      expect(result.database.status).toBe('connected');
      expect(result.database.responseTime).toBeDefined();
    });

    it('should handle database connection errors', async () => {
      // Simuler une erreur de base de données
      jest
        .spyOn(prismaService, '$queryRaw')
        .mockRejectedValueOnce(new Error('DB error'));

      const result = await service.getHealthInfo();

      expect(result.status).toBe('ok'); // Le statut général reste ok
      expect(result.database.status).toBe('error');
      expect(result.database.error).toBe('DB error');
    });

    it('should handle unexpected errors during health check', async () => {
      // Simuler une erreur générale
      jest
        .spyOn(service as any, 'checkDatabaseConnection')
        .mockRejectedValueOnce(new Error('General error'));

      const result = await service.getHealthInfo();

      expect(result.status).toBe('error');
      expect(result.message).toBe(
        'Impossible de récupérer les données de santé',
      );
      expect(result.error).toBe('General error');
    });
  });

  describe('Utility methods', () => {
    it('formatBytes should convert bytes to readable format', () => {
      const formatBytes = service['formatBytes'].bind(service);

      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1500)).toContain('KB');
    });

    it('formatUptime should format seconds to readable uptime', () => {
      const formatUptime = service['formatUptime'].bind(service);

      expect(formatUptime(30)).toBe('0j 0h 0m 30s');
      expect(formatUptime(3600)).toBe('0j 1h 0m 0s');
      expect(formatUptime(86400)).toBe('1j 0h 0m 0s');
      expect(formatUptime(90061)).toBe('1j 1h 1m 1s');
    });
  });
});
