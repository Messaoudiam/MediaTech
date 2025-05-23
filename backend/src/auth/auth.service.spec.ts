import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'USER' as const,
    isLocked: false,
    failedAttempts: 0,
    lastLogin: null,
    isEmailVerified: false,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    activeBorrowingsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: '1',
    email: 'test@example.com',
    role: 'USER' as const,
    isLocked: false,
    failedAttempts: 0,
    lastLogin: null,
    isEmailVerified: false,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    activeBorrowingsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findUserByEmail: jest.fn(),
            createUser: jest.fn(),
            resetUserLockout: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            lockUserAccount: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Mock console pour éviter les logs de test
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      usersService.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        isLocked: mockUser.isLocked,
        failedAttempts: mockUser.failedAttempts,
        lastLogin: mockUser.lastLogin,
        isEmailVerified: mockUser.isEmailVerified,
        emailVerificationToken: mockUser.emailVerificationToken,
        emailVerificationExpires: mockUser.emailVerificationExpires,
        activeBorrowingsCount: mockUser.activeBorrowingsCount,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(usersService.resetUserLockout).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.incrementFailedAttempts).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        isLocked: true,
        lastLogin: new Date(),
      };
      usersService.findUserByEmail.mockResolvedValue(lockedUser);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      usersService.createUser.mockResolvedValue(mockUserWithoutPassword);

      const result = await service.register(
        'newuser@example.com',
        'password123',
      );

      expect(result).toEqual(mockUserWithoutPassword);
      expect(usersService.createUser).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'hashedPassword',
      });
    });

    it('should throw UnauthorizedException when user already exists', async () => {
      usersService.findUserByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register('existing@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.generateTokens(mockUserWithoutPassword);

      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id },
        { expiresIn: '7d' },
      );
    });
  });
});
