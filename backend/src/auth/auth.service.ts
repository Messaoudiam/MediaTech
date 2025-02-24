// nestjs
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { CONFIG } from '../config/app.config';

// prisma
import { User } from '@prisma/client';

// services
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

// bcrypt
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private readonly MAX_ATTEMPTS = CONFIG.security.auth.maxAttempts;
  private readonly LOCK_DURATION = CONFIG.security.auth.lockDuration;

  async validateUser(email: string, password: string): Promise<any> {
    this.logger.log(`Tentative de connexion pour: ${email}`);

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
      const lockTime = user.lastLogin?.getTime() || 0;
      const currentTime = new Date().getTime();

      if (currentTime - lockTime < this.LOCK_DURATION) {
        throw new UnauthorizedException(
          'Compte temporairement verrouillé. Veuillez réessayer plus tard.',
        );
      } else {
        // Réinitialiser le verrouillage après la durée
        await this.usersService.resetLockout(user.id);
      }
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Échec de connexion pour: ${email}`);
      // Incrémenter le compteur d'échecs
      const updatedAttempts = user.failedAttempts + 1;

      if (updatedAttempts >= this.MAX_ATTEMPTS) {
        await this.usersService.lockAccount(user.id);
        throw new UnauthorizedException(
          'Compte verrouillé suite à trop de tentatives. Veuillez réessayer dans 15 minutes.',
        );
      }

      await this.usersService.incrementFailedAttempts(user.id);
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Réinitialiser le compteur en cas de succès
    await this.usersService.resetLockout(user.id);

    const { password: userPassword, ...result } = user;
    return result;
  }

  async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        { expiresIn: '15m' },
      ),
      this.jwtService.signAsync({ sub: user.id }, { expiresIn: '7d' }),
    ]);

    return { accessToken, refreshToken };
  }
}
