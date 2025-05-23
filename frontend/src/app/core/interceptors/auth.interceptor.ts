import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const httpClient = inject(HttpClient);
  const router = inject(Router);

  // Liste des endpoints publics qui ne nécessitent pas d'authentification
  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/check-auth',
    '/books', // endpoints publics pour les livres
    '/search', // recherche publique
    '/public', // autres endpoints publics
  ];

  // Vérifier si l'endpoint est public
  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    request.url.includes(endpoint)
  );

  // Ajouter withCredentials à toutes les requêtes pour inclure les cookies
  const modifiedRequest = request.clone({
    withCredentials: true,
  });

  return next(modifiedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Ne tenter le refresh automatique QUE si :
      // 1. C'est une erreur 401
      // 2. Ce n'est pas un endpoint public
      // 3. Ce n'est pas déjà une tentative de refresh
      if (
        error.status === 401 &&
        !isPublicEndpoint &&
        !request.url.includes('/auth/refresh')
      ) {
        console.log('Tentative de refresh automatique pour:', request.url);

        // Tenter de rafraîchir le token
        return httpClient
          .post(
            `${environment.apiUrl}/auth/refresh`,
            {},
            {
              withCredentials: true,
            }
          )
          .pipe(
            switchMap(() => {
              console.log('Refresh réussi, retry de la requête originale');
              // Si le refresh réussit, retry la requête originale
              return next(modifiedRequest);
            }),
            catchError((refreshError) => {
              // Si le refresh échoue, rediriger vers login
              console.error('Refresh token expired, redirecting to login');
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
      }

      // Pour les endpoints publics ou autres erreurs, passer l'erreur sans traitement
      return throwError(() => error);
    })
  );
};
