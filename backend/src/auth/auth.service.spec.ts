import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock du UsersService
const mockUsersService = {
  // Simulation de la méthode findByEmail
  findByEmail: jest.fn(),
  // Simulation des méthodes de gestion du verrouillage
  resetLockout: jest.fn(),
  incrementFailedAttempts: jest.fn(),
  lockAccount: jest.fn(),
};

// Mock du JwtService
const mockJwtService = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  // Configuration initiale avant chaque test
  beforeEach(async () => {
    // Création d'un module de test avec nos services mockés
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    // Récupération de l'instance du service à tester
    service = module.get<AuthService>(AuthService);

    // Réinitialisation des mocks avant chaque test
    jest.clearAllMocks();
  });

  // Test de base pour vérifier que le service est défini
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Suite de tests pour la méthode validateUser
  describe('validateUser', () => {
    // Test du cas de succès
    it('should successfully validate user with correct credentials', async () => {
      // Arrangement (Prepare)
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        isLocked: false,
        failedAttempts: 0,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      // Action (Act)
      const result = await service.validateUser(
        'test@test.com',
        'Password123!',
      );

      // Assertion (Assert)
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(mockUsersService.resetLockout).toHaveBeenCalledWith(mockUser.id);
    });

    // Test du cas d'échec avec mauvais mot de passe
    it('should fail validation with incorrect password', async () => {
      // Arrangement
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        isLocked: false,
        failedAttempts: 0,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      // Action & Assertion
      await expect(
        service.validateUser('test@test.com', 'WrongPassword123!'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.incrementFailedAttempts).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });
});
