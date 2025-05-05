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
          const accessToken =
            request?.cookies?.access_token || request?.cookies?.accessToken;
          if (!accessToken) {
            return null;
          }
          return accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Le payload a été vérifié, on le retourne
    // Dans le cas d'une vérification supplémentaire, on pourrait consulter la base de données ici
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
