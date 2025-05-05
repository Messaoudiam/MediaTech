import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Ajouter withCredentials: true à toutes les requêtes pour envoyer les cookies
  const modifiedRequest = request.clone({
    withCredentials: true,
  });

  return next(modifiedRequest);
};
