import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable, map, of, catchError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  // Ajout d'une propriété pour éviter les redirections en boucle
  private processingAuth = false;

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // Autoriser l'accès aux pages publiques sans authentification
    if (
      state.url === '/landing' ||
      state.url.startsWith('/books/') ||
      state.url === '/' ||
      state.url.startsWith('/search')
    ) {
      return true;
    }

    // Vérifier si nous sommes déjà en train de traiter une authentification
    if (this.processingAuth) {
      return true;
    }

    this.processingAuth = true;

    try {
      // Récupération du rôle requis depuis les données de route
      const requiredRole = route.data['requiredRole'];

      // Si aucun rôle n'est requis, vérifier seulement l'authentification
      if (!requiredRole) {
        return this.authService.isAuthenticated().pipe(
          map((isAuthenticated) => {
            this.processingAuth = false;
            if (isAuthenticated) {
              return true;
            } else {
              return this.router.createUrlTree(['/auth/login']);
            }
          }),
          catchError((error) => {
            this.processingAuth = false;
            console.error(
              "Erreur lors de la vérification d'authentification:",
              error
            );
            return of(this.router.createUrlTree(['/auth/login']));
          })
        );
      }

      // Si on connaît déjà l'utilisateur, vérifier son rôle directement
      const currentUser = this.authService.currentUser;
      if (currentUser) {
        this.processingAuth = false;

        // Vérifier si le rôle de l'utilisateur correspond au rôle requis (ignorer la casse)
        const userRole = currentUser.role?.toLowerCase();
        const requiredRoleLower = requiredRole.toLowerCase();

        if (userRole === requiredRoleLower) {
          return true;
        } else {
          // Vérifier que nous ne sommes pas déjà sur la page de destination pour éviter une boucle
          if (
            (userRole === 'admin' || userRole === 'ADMIN') &&
            state.url !== '/admin'
          ) {
            return this.router.createUrlTree(['/admin']);
          } else if (
            (userRole === 'user' || userRole === 'USER') &&
            state.url !== '/home'
          ) {
            return this.router.createUrlTree(['/home']);
          } else {
            // Si nous sommes déjà sur la bonne page pour le rôle, autoriser l'accès
            return true;
          }
        }
      }

      // Sinon, récupérer le profil et vérifier le rôle
      return this.authService.getUserProfile().pipe(
        map((user) => {
          this.processingAuth = false;

          if (!user) {
            return this.router.createUrlTree(['/auth/login']);
          }

          // Vérifier si le rôle de l'utilisateur correspond au rôle requis (ignorer la casse)
          const userRole = user.role?.toLowerCase();
          const requiredRoleLower = requiredRole.toLowerCase();

          if (userRole === requiredRoleLower) {
            return true;
          } else {
            // Vérifier que nous ne sommes pas déjà sur la page de destination pour éviter une boucle
            if (
              (userRole === 'admin' || userRole === 'ADMIN') &&
              state.url !== '/admin'
            ) {
              return this.router.createUrlTree(['/admin']);
            } else if (
              (userRole === 'user' || userRole === 'USER') &&
              state.url !== '/home'
            ) {
              return this.router.createUrlTree(['/home']);
            } else {
              // Si nous sommes déjà sur la bonne page pour le rôle, autoriser l'accès
              return true;
            }
          }
        }),
        catchError((error) => {
          this.processingAuth = false;
          console.error('Erreur lors de la récupération du profil:', error);
          return of(this.router.createUrlTree(['/auth/login']));
        })
      );
    } catch (error) {
      this.processingAuth = false;
      console.error('Erreur inattendue dans AuthGuard:', error);
      return this.router.createUrlTree(['/auth/login']);
    }
  }
}
