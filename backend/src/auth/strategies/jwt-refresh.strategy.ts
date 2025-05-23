import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extraire le token du cookie refresh_token (nom correct)
        (request: Request) => {
          const refreshToken = request?.cookies?.refresh_token;
          if (!refreshToken) {
            return null;
          }
          return refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Le payload a été vérifié, on le retourne
    // Dans le refresh token on a seulement l'ID utilisateur
    return { id: payload.sub };
  }
}
