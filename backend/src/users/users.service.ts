// nestjs
import { Injectable, NotFoundException } from '@nestjs/common';

// prisma
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, UserRole } from '@prisma/client';

// bcrypt
import * as bcrypt from 'bcryptjs';

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
   * Compte le nombre total d'utilisateurs dans le système
   * @returns Le nombre total d'utilisateurs
   */
  async countUsers(): Promise<number> {
    return this.prisma.user.count();
  }
}
