import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService Integration', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        PrismaService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('test_token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  // Nettoyage après chaque test
  afterEach(async () => {
    await prismaService.user.deleteMany();
  });

  describe('Authentification', () => {
    it('devrait créer un utilisateur et valider ses identifiants', async () => {
      const newUser = await usersService.create({
        email: 'test@example.com',
        password: 'Password123!',
      });

      // Test de l'authentification via AuthService
      const validatedUser = await authService.validateUser(
        'test@example.com',
        'Password123!',
      );

      // Vérifications
      expect(validatedUser).toBeDefined();
      expect(validatedUser.email).toBe('test@example.com');
      expect(validatedUser.failedAttempts).toBe(0);
    });

    it('devrait échouer avec un mauvais mot de passe', async () => {
      // Création d'un utilisateur
      await usersService.create({
        email: 'test@example.com',
        password: 'Password123!',
      });

      // Test avec mauvais mot de passe
      await expect(
        authService.validateUser('test@example.com', 'WrongPassword123!'),
      ).rejects.toThrow(UnauthorizedException);

      // Vérifier que le compteur d'échecs a été incrémenté
      const user = await prismaService.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(user?.failedAttempts).toBe(1);
    });
  });
});
