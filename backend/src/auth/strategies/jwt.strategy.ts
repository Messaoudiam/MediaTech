import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Essayer d'abord d'extraire le token du header Bearer
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Puis essayer d'extraire le token du cookie
        (request: Request) => {
          this.logger.debug('Cookies disponibles:', request.cookies);
          const accessToken =
            request?.cookies?.access_token || request?.cookies?.accessToken;
          if (!accessToken) {
            this.logger.debug('Aucun token trouvé dans les cookies');
            return null;
          }
          this.logger.debug('Token trouvé dans les cookies');
          return accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
    this.logger.log(
      'JwtStrategy initialisée - Extraction depuis Bearer Token et Cookies',
    );
  }

  async validate(payload: any) {
    this.logger.debug('Payload du token JWT:', payload);
    // Le payload a été vérifié, on le retourne
    // Dans le cas d'une vérification supplémentaire, on pourrait consulter la base de données ici
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
