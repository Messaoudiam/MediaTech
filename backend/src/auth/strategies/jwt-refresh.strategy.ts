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
        // Extraire le token du cookie refreshToken
        (request: Request) => {
          this.logger.debug(
            'Cookies disponibles pour refresh:',
            request.cookies,
          );
          const refreshToken = request?.cookies?.refreshToken;
          if (!refreshToken) {
            this.logger.debug(
              'Aucun token de rafraîchissement trouvé dans les cookies',
            );
            return null;
          }
          this.logger.debug(
            'Token de rafraîchissement trouvé dans les cookies',
          );
          return refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    this.logger.debug('Payload du token de rafraîchissement JWT:', payload);
    // Le payload a été vérifié, on le retourne
    // Dans le refresh token on a seulement l'ID utilisateur
    return { id: payload.sub };
  }
}
