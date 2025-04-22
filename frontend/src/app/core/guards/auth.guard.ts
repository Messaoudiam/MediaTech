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
    console.log('AuthGuard: vérification des autorisations pour:', state.url);

    // Autoriser l'accès aux pages publiques sans authentification
    if (state.url === '/landing' || state.url.startsWith('/books/')) {
      console.log('Page publique, accès autorisé sans authentification');
      return true;
    }

    // Vérifier si nous sommes déjà en train de traiter une authentification
    if (this.processingAuth) {
      console.log(
        "Traitement d'authentification déjà en cours, accès autorisé"
      );
      return true;
    }

    this.processingAuth = true;

    try {
      // Récupération du rôle requis depuis les données de route
      const requiredRole = route.data['requiredRole'];
      console.log('Rôle requis:', requiredRole);

      // Si aucun rôle n'est requis, vérifier seulement l'authentification
      if (!requiredRole) {
        console.log(
          "Aucun rôle requis, vérification de l'authentification uniquement"
        );
        return this.authService.isAuthenticated().pipe(
          map((isAuthenticated) => {
            this.processingAuth = false;
            if (isAuthenticated) {
              console.log('Utilisateur authentifié, accès autorisé');
              return true;
            } else {
              console.log(
                'Utilisateur non authentifié, redirection vers login'
              );
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

      // Si un rôle est requis, vérifier l'authentification et le rôle
      console.log("Vérification du rôle de l'utilisateur");

      // Si on connaît déjà l'utilisateur, vérifier son rôle directement
      const currentUser = this.authService.currentUser;
      if (currentUser) {
        console.log('Utilisateur déjà chargé:', currentUser);
        this.processingAuth = false;

        // Vérifier si le rôle de l'utilisateur correspond au rôle requis (ignorer la casse)
        const userRole = currentUser.role?.toLowerCase();
        const requiredRoleLower = requiredRole.toLowerCase();
        console.log('Comparaison des rôles:', userRole, requiredRoleLower);

        if (userRole === requiredRoleLower) {
          console.log('Utilisateur a le rôle requis, accès autorisé');
          return true;
        } else {
          console.log("Utilisateur n'a pas le rôle requis, redirection");
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
            console.log('Déjà sur la bonne page pour le rôle, accès autorisé');
            return true;
          }
        }
      }

      // Sinon, récupérer le profil et vérifier le rôle
      return this.authService.getUserProfile().pipe(
        map((user) => {
          this.processingAuth = false;
          console.log('Profil utilisateur récupéré:', user);

          if (!user) {
            return this.router.createUrlTree(['/auth/login']);
          }

          // Vérifier si le rôle de l'utilisateur correspond au rôle requis (ignorer la casse)
          const userRole = user.role?.toLowerCase();
          const requiredRoleLower = requiredRole.toLowerCase();
          console.log('Comparaison des rôles:', userRole, requiredRoleLower);

          if (userRole === requiredRoleLower) {
            console.log('Utilisateur a le rôle requis, accès autorisé');
            return true;
          } else {
            console.log("Utilisateur n'a pas le rôle requis, redirection");
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
              console.log(
                'Déjà sur la bonne page pour le rôle, accès autorisé'
              );
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
