// nestjs
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { CONFIG } from '../config/app.config';

// prisma
import { User } from '@prisma/client';

// services
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

// bcrypt
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private readonly MAX_ATTEMPTS = CONFIG.security.auth.maxAttempts;
  private readonly LOCK_DURATION = CONFIG.security.auth.lockDuration;

  // Méthode unique pour le hachage de mot de passe
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Méthode unique pour la vérification de mot de passe
  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      this.logger.error(`Erreur bcrypt: ${error.message}`);
      return false;
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    // Normaliser l'email en minuscules
    const normalizedEmail = email.toLowerCase();
    this.logger.log(`Tentative de connexion pour: ${normalizedEmail}`);

    const user = await this.usersService.findUserByEmail(normalizedEmail);

    if (!user) {
      this.logger.warn(
        `Utilisateur non trouvé pour l'email: ${normalizedEmail}`,
      );
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked) {
      const lockTime = user.lastLogin?.getTime() || 0;
      const currentTime = new Date().getTime();

      if (currentTime - lockTime < this.LOCK_DURATION) {
        this.logger.warn(`Compte ${normalizedEmail} toujours verrouillé`);
        throw new UnauthorizedException(
          'Compte temporairement verrouillé. Veuillez réessayer plus tard.',
        );
      } else {
        // Réinitialiser le verrouillage après la durée
        this.logger.log(
          `Réinitialisation du verrouillage pour ${normalizedEmail}`,
        );
        await this.usersService.resetUserLockout(user.id);
      }
    }

    // Vérifier le mot de passe
    try {
      // Logs pour débogage
      this.logger.debug(
        `Vérification du mot de passe pour: ${normalizedEmail}`,
      );
      this.logger.debug(`Mot de passe fourni (${password.length} caractères)`);
      this.logger.debug(`Hash stocké: ${user.password.substring(0, 15)}...`);

      // Vérification directe sans manipulation
      const isPasswordValid = await this.verifyPassword(
        password,
        user.password,
      );

      this.logger.debug(`Résultat de la vérification: ${isPasswordValid}`);

      if (!isPasswordValid) {
        this.logger.warn(
          `Échec de connexion pour: ${normalizedEmail} - Mot de passe invalide`,
        );

        // Incrémenter le compteur d'échecs
        const updatedAttempts = user.failedAttempts + 1;
        this.logger.warn(
          `Tentatives échouées: ${updatedAttempts}/${this.MAX_ATTEMPTS}`,
        );

        if (updatedAttempts >= this.MAX_ATTEMPTS) {
          this.logger.warn(
            `Verrouillage du compte ${normalizedEmail} - Trop de tentatives`,
          );
          await this.usersService.lockUserAccount(user.id);
          throw new UnauthorizedException(
            'Compte verrouillé suite à trop de tentatives. Veuillez réessayer dans 15 minutes.',
          );
        }

        await this.usersService.incrementFailedAttempts(user.id);
        throw new UnauthorizedException('Email ou mot de passe incorrect');
      }

      // Réinitialiser le compteur en cas de succès
      this.logger.log(
        `Connexion réussie pour ${normalizedEmail} - Réinitialisation du compteur`,
      );
      await this.usersService.resetUserLockout(user.id);

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Erreur lors de la vérification du mot de passe: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException(
        'Erreur lors de la vérification des identifiants',
      );
    }
  }

  async generateTokens(user: Partial<User>) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        { expiresIn: '15m' },
      ),
      this.jwtService.signAsync({ sub: user.id }, { expiresIn: '7d' }),
    ]);

    return { accessToken, refreshToken };
  }

  async register(email: string, password: string) {
    // Normaliser l'email en minuscules
    const normalizedEmail = email.toLowerCase();

    // Vérifier si l'utilisateur existe déjà
    const existingUser =
      await this.usersService.findUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new UnauthorizedException('Cet email est déjà utilisé');
    }

    try {
      // Logs pour débogage
      this.logger.debug(`Création de compte pour: ${normalizedEmail}`);
      this.logger.debug(
        `Mot de passe à hacher (${password.length} caractères)`,
      );

      // Hachage du mot de passe avec notre méthode factoriséee
      const hashedPassword = await this.hashPassword(password);
      this.logger.debug(`Hash généré: ${hashedPassword.substring(0, 15)}...`);

      // Créer l'utilisateur avec email normalisé
      const newUser = await this.usersService.createUser({
        email: normalizedEmail,
        password: hashedPassword,
      });

      return newUser;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du compte: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Erreur lors de la création du compte');
    }
  }

  setAccessTokenCookie(response: Response, token: string) {
    response.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });
  }

  setRefreshTokenCookie(response: Response, token: string) {
    response.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
}
