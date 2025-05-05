import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

// Mock de la réponse de santé
const mockHealthResponse = {
  status: 'ok',
  timestamp: '2023-07-14T12:34:56.789Z',
  app: {
    name: 'Mon Projet Fullstack API',
    version: '1.0.0',
    nodeVersion: 'v18.15.0',
    environment: 'test',
  },
  system: {
    uptime: {
      seconds: 3600,
      formattedUptime: '0j 1h 0m 0s',
    },
    hostname: 'test-host',
    platform: 'test-platform',
    cpus: {
      count: 4,
      model: 'Test CPU',
    },
  },
  memory: {
    rss: '150.5 MB',
    heapTotal: '70.2 MB',
    heapUsed: '62.8 MB',
    external: '1.2 MB',
    systemTotal: '16.0 GB',
    systemFree: '8.5 GB',
    systemUsage: '47%',
  },
  database: {
    status: 'connected',
    responseTime: 12,
  },
};

// Mock du service de santé
const mockHealthService = {
  getHealthInfo: jest.fn().mockResolvedValue(mockHealthResponse),
};

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health information', async () => {
      const result = await controller.getHealth();

      expect(result).toEqual(mockHealthResponse);
      expect(service.getHealthInfo).toHaveBeenCalled();
    });

    it('should handle errors properly', async () => {
      // Simuler une erreur
      const errorResponse = {
        status: 'error',
        message: 'Impossible de récupérer les données de santé',
        error: 'Test error',
      };

      jest.spyOn(service, 'getHealthInfo').mockResolvedValueOnce(errorResponse);

      const result = await controller.getHealth();

      expect(result).toEqual(errorResponse);
      expect(service.getHealthInfo).toHaveBeenCalled();
    });
  });
});
