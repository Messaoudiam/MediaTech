// nestjs
import { Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshAuthGuard.name);

  handleRequest(err, user, info, context, status) {
    if (err || !user) {
    } else {
    }

    // AuthGuard lancera une exception si nécessaire
    return super.handleRequest(err, user, info, context, status);
  }
}
