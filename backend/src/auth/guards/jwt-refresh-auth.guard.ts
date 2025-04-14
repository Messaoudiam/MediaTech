// nestjs
import { Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshAuthGuard.name);

  handleRequest(err, user, info, context, status) {
    if (err || !user) {
      this.logger.debug(
        'Erreur ou utilisateur non trouvé lors du rafraîchissement JWT:',
        { err, info },
      );
    } else {
      this.logger.debug(
        'Utilisateur authentifié via token de rafraîchissement:',
        user,
      );
    }

    // AuthGuard lancera une exception si nécessaire
    return super.handleRequest(err, user, info, context, status);
  }
}
