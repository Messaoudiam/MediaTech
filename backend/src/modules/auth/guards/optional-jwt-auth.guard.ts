import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Garde d'authentification JWT optionnelle.
 * Permet aux requêtes non-authentifiées de passer, mais
 * attache les informations de l'utilisateur si un token valide est présent.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Ne lève pas d'exception si l'authentification échoue
    return user;
  }
}
