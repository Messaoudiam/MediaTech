// nestjs
import { Injectable, NotFoundException } from '@nestjs/common';

// prisma
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, UserRole } from '@prisma/client';

// bcrypt
import * as bcrypt from 'bcryptjs';

// crypto
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(
    data: Prisma.UserCreateInput,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany();
    return users.map(
      ({ password, ...userWithoutPassword }) => userWithoutPassword,
    );
  }

  async findOneUser(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateUserRole(
    id: string,
    role: UserRole,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async incrementFailedAttempts(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts: { increment: 1 },
      },
    });
  }

  async lockUserAccount(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        isLocked: true,
        lastLogin: new Date(),
      },
    });
  }

  async resetUserLockout(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts: 0,
        isLocked: false,
        lastLogin: new Date(),
      },
    });
  }

  /**
   * Génère un token de vérification d'email et l'associe à l'utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Le token généré
   */
  async generateEmailVerificationToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
      },
    });

    return token;
  }

  /**
   * Vérifie un token de vérification d'email et active le compte
   * @param token - Token de vérification
   * @returns L'utilisateur vérifié ou null si le token est invalide
   */
  async verifyEmailToken(
    token: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return null;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Vérifie si un utilisateur a son email vérifié
   * @param userId - ID de l'utilisateur
   * @returns true si l'email est vérifié
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isEmailVerified: true },
    });

    return user?.isEmailVerified ?? false;
  }

  /**
   * Compte le nombre total d'utilisateurs dans le système
   * @returns Le nombre total d'utilisateurs
   */
  async countUsers(): Promise<number> {
    return this.prisma.user.count();
  }
}
