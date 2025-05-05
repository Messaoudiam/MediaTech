import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Simplifier l'intercepteur pour n'utiliser que les cookies
  // Les cookies seront automatiquement inclus avec withCredentials: true
  const modifiedRequest = request.clone({
    withCredentials: true, // Envoyer les cookies avec chaque requête
  });

  return next(modifiedRequest);
};
