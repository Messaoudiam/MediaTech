// nestjs
import { Injectable } from '@nestjs/common';

// prisma
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

// bcrypt
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany();
    return users.map(
      ({ password, ...userWithoutPassword }) => userWithoutPassword,
    );
  }

  async findOne(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async incrementFailedAttempts(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts: { increment: 1 },
      },
    });
  }

  async lockAccount(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        isLocked: true,
        lastLogin: new Date(),
      },
    });
  }

  async resetLockout(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        failedAttempts: 0,
        isLocked: false,
        lastLogin: new Date(),
      },
    });
  }
}
