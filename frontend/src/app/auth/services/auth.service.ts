// angular
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// rxjs
import {
  Observable,
  BehaviorSubject,
  of,
  throwError,
  interval,
  timer,
} from 'rxjs';
import { tap, catchError, map, switchMap, takeWhile } from 'rxjs/operators';

// models
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '../models/auth.model';

// environment
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  // Configuration de l'API depuis l'environnement
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Flag pour activer le mode API réelle (à true) ou démo (à false)
  private readonly USE_REAL_API = true;

  // Système de refresh automatique
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  // Mock user pour le mode démo
  private mockUser: User = {
    id: '1',
    email: 'demo@example.com',
    nom: 'Utilisateur',
    prenom: 'Démo',
    role: 'user',
  };

  constructor(private http: HttpClient, private router: Router) {
    // Au démarrage, vérifier si l'utilisateur est connecté
    this.checkAuthStatus();

    // Ne PAS démarrer automatiquement le refresh - il sera démarré seulement si l'utilisateur est connecté
  }

  // Démarre le système de refresh automatique
  private startAutoRefresh(): void {
    if (!this.USE_REAL_API) return;

    // Ne démarrer le refresh automatique que si un utilisateur est connecté
    if (!this.currentUserSubject.value) {
      console.log("Pas d'utilisateur connecté, pas de refresh automatique");
      return;
    }

    // Nettoyer l'ancien interval s'il existe
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    console.log(
      'Démarrage du système de refresh automatique (toutes les 10 minutes)'
    );

    // Créer un nouvel interval qui vérifie périodiquement
    this.refreshInterval = setInterval(() => {
      // Double vérification : l'utilisateur est-il toujours connecté ?
      if (this.currentUserSubject.value) {
        console.log('Refresh automatique en cours...');
        this.silentRefresh().subscribe({
          next: () => console.log('Refresh automatique réussi'),
          error: (error) => {
            console.warn('Refresh automatique échoué:', error);
            // Si le refresh échoue, arrêter le refresh automatique
            this.stopAutoRefresh();
          },
        });
      } else {
        // Si plus d'utilisateur connecté, arrêter le refresh automatique
        console.log(
          "Plus d'utilisateur connecté, arrêt du refresh automatique"
        );
        this.stopAutoRefresh();
      }
    }, this.REFRESH_INTERVAL_MS);
  }

  // Arrête le système de refresh automatique
  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      console.log('Arrêt du système de refresh automatique');
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Refresh silencieux (sans redirection en cas d'erreur)
  private silentRefresh(): Observable<any> {
    return this.http
      .post(`${this.API_URL}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        catchError((error) => {
          // Si le refresh silencieux échoue, on ne fait rien de drastique
          return throwError(() => error);
        })
      );
  }

  // Vérifie l'état d'authentification au démarrage
  private checkAuthStatus(): void {
    // Si l'API est activée, vérifier l'authentification via les cookies
    if (this.USE_REAL_API) {
      console.log("Vérification silencieuse de l'authentification...");
      this.http
        .get<{ user: User }>(`${this.API_URL}/auth/check-auth`, {
          withCredentials: true,
        })
        .pipe(
          catchError(() => {
            // En cas d'erreur (non connecté), silencieux - c'est normal
            return of(null);
          })
        )
        .subscribe((response) => {
          if (response && response.user) {
            console.log(
              'Utilisateur authentifié trouvé, démarrage du refresh automatique:',
              response.user
            );
            this.currentUserSubject.next(response.user);
            // Démarrer le système de refresh automatique seulement si l'utilisateur est connecté
            this.startAutoRefresh();
          } else {
            console.log('Aucun utilisateur connecté trouvé');
            // S'assurer que le refresh automatique est arrêté
            this.stopAutoRefresh();
          }
        });
    }
  }

  // Redirige l'utilisateur vers le dashboard approprié en fonction de son rôle
  private redirectBasedOnRole(user: User): void {
    if (!user || !user.role) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Normaliser le rôle pour la comparaison (ignorer la casse)
    const userRole = user.role.toLowerCase();

    // Vérifier l'URL actuelle pour éviter les redirections en boucle
    const currentUrl = this.router.url;

    // Si l'utilisateur est déjà sur le bon dashboard, ne pas rediriger
    if (
      (userRole === 'admin' && currentUrl === '/admin') ||
      (userRole === 'user' && currentUrl === '/home')
    ) {
      return;
    }

    console.log('Redirection basée sur le rôle:', userRole);

    // Utiliser un court délai pour permettre à Angular de terminer son cycle
    setTimeout(() => {
      if (userRole === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/home']);
      }
    }, 300);
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    if (!credentials.email || !credentials.password) {
      return throwError(
        () => new Error('Identifiants de connexion incomplets')
      );
    }

    if (!this.USE_REAL_API) {
      // Mode démo - simulation de connexion
      const mockResponse = {
        user: this.mockUser,
        token: 'fake-jwt-token',
        access_token: 'fake-access-token',
        message: 'Connexion réussie',
      };

      return of(mockResponse).pipe(
        tap((response) => {
          this.currentUserSubject.next(response.user);
          // Redirection basée sur le rôle
          this.redirectBasedOnRole(response.user);
        })
      );
    } else {
      // Version réelle avec API
      return this.http
        .post<AuthResponse>(`${this.API_URL}/auth/login`, credentials, {
          withCredentials: true,
        })
        .pipe(
          tap((response) => {
            if (response && response.user) {
              console.log('Réponse de connexion:', response);
              this.currentUserSubject.next(response.user);
              // Démarrer le système de refresh automatique
              this.startAutoRefresh();
              // Redirection basée sur le rôle
              this.redirectBasedOnRole(response.user);
            }
          }),
          catchError((error) => {
            // Si l'erreur est une erreur d'authentification (401)
            if (error.status === 401) {
              // Vérifie si l'erreur contient un message spécifique sur le verrouillage du compte
              if (
                error.error?.message?.includes('verrouillé') ||
                error.statusText?.includes('verrouillé') ||
                error.error?.message?.includes('temporairement')
              ) {
                return throwError(() => ({
                  status: 401,
                  error: {
                    message:
                      'Compte temporairement verrouillé. Veuillez réessayer plus tard.',
                  },
                }));
              } else {
                return throwError(() => ({
                  status: 401,
                  error: { message: 'Email ou mot de passe incorrect' },
                }));
              }
            }

            return throwError(() => error);
          })
        );
    }
  }

  register(userData: RegisterCredentials): Observable<AuthResponse> {
    if (!this.USE_REAL_API) {
      // Mode démo - simulation d'inscription
      console.log('Mode démo - Inscription simulée:', userData);
      return of({
        user: this.mockUser,
        token: 'fake-jwt-token',
        message: 'Inscription réussie (mode démo)',
      }).pipe(
        tap(() => {
          console.log('Inscription réussie (mode démo)');
          this.currentUserSubject.next(this.mockUser);
        })
      );
    }

    return this.http
      .post<AuthResponse>(`${this.API_URL}/auth/register`, userData, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          console.log('Inscription réussie:', response);
          // Note: Ne pas définir l'utilisateur comme connecté après l'inscription
          // L'utilisateur doit d'abord vérifier son email
        }),
        catchError((error) => {
          console.error("Erreur lors de l'inscription:", error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Vérifie l'email avec le token reçu
   * @param token Token de vérification
   * @returns Observable avec la réponse de vérification
   */
  verifyEmail(token: string): Observable<{ message: string; user?: any }> {
    if (!this.USE_REAL_API) {
      // Mode démo - simulation de vérification
      return of({
        message: 'Email vérifié avec succès (mode démo)',
        user: this.mockUser,
      });
    }

    return this.http
      .get<{ message: string; user?: any }>(
        `${this.API_URL}/auth/verify-email`,
        {
          params: { token },
          withCredentials: true,
        }
      )
      .pipe(
        tap((response) => {
          console.log('Email vérifié avec succès:', response);
        }),
        catchError((error) => {
          console.error('Erreur lors de la vérification:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): Observable<any> {
    // Arrêter le système de refresh automatique
    this.stopAutoRefresh();

    if (!this.USE_REAL_API) {
      // Mode démo - simulation de déconnexion
      return of(null).pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          this.router.navigate(['/landing']);
        })
      );
    } else {
      // Version réelle avec API
      return this.http
        .post(
          `${this.API_URL}/auth/logout`,
          {},
          {
            withCredentials: true, // Important pour la gestion des cookies
          }
        )
        .pipe(
          tap(() => {
            this.currentUserSubject.next(null);
            this.router.navigate(['/landing']);
          }),
          catchError((error) => {
            // Même en cas d'erreur, on nettoie côté client
            this.currentUserSubject.next(null);
            return throwError(() => error);
          })
        );
    }
  }

  isAuthenticated(): Observable<boolean> {
    if (!this.USE_REAL_API) {
      // Mode démo - utiliser l'état actuel
      return of(!!this.currentUserSubject.value);
    } else {
      // Vérifier auprès de l'API si l'utilisateur est authentifié
      // Utiliser un endpoint silencieux (qui ne génère pas d'erreur visible si non connecté)
      return this.http
        .get<{ user: User }>(`${this.API_URL}/auth/check-auth`, {
          withCredentials: true,
        })
        .pipe(
          map((response) => {
            if (response && response.user) {
              this.currentUserSubject.next(response.user);
              return true;
            }
            return false;
          }),
          catchError(() => {
            // En cas d'erreur (non connecté), retourner false silencieusement
            this.currentUserSubject.next(null);
            return of(false);
          })
        );
    }
  }

  // Récupère le profil utilisateur (en ayant déjà un token JWT valide)
  getUserProfile(): Observable<User> {
    if (!this.USE_REAL_API) {
      // Mode démo - retourner l'utilisateur fictif
      return of(this.mockUser);
    } else {
      // Si nous avons déjà l'utilisateur courant, le retourner directement
      if (this.currentUserSubject.value) {
        return of(this.currentUserSubject.value);
      }

      // Sinon, faire une requête pour récupérer le profil
      return this.http
        .get<{ user: User } | User>(`${this.API_URL}/auth/profile`, {
          withCredentials: true,
        })
        .pipe(
          map((response) => {
            // Gestion des deux formats de réponse possibles
            const user = 'user' in response ? response.user : response;
            this.currentUserSubject.next(user);
            return user;
          }),
          catchError((error) => {
            // Si 404, essayer un autre endpoint
            if (error.status === 404) {
              return this.http
                .get<{ user: User } | User>(`${this.API_URL}/auth/check-auth`, {
                  withCredentials: true,
                })
                .pipe(
                  map((response) => {
                    const user = 'user' in response ? response.user : response;
                    this.currentUserSubject.next(user);
                    return user;
                  }),
                  catchError((finalError) => {
                    console.error(
                      'Impossible de récupérer le profil utilisateur',
                      finalError
                    );
                    return throwError(() => finalError);
                  })
                );
            }
            return throwError(() => error);
          })
        );
    }
  }

  // Getter pour l'utilisateur actuel
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Méthode pour débloquer un compte verrouillé après trop de tentatives
  resetAccountLock(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/reset-lock`, { email });
  }

  // Méthode pour rafraîchir le token manuellement
  refreshToken(): Observable<any> {
    if (!this.USE_REAL_API) {
      // Mode démo - simulation de refresh
      return of({ message: 'Token rafraîchi (mode démo)' });
    } else {
      return this.http
        .post(
          `${this.API_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        )
        .pipe(
          tap((response) => {
            console.log('Token rafraîchi avec succès');
          }),
          catchError((error) => {
            console.error('Échec du rafraîchissement du token:', error);
            // En cas d'échec du refresh, déconnecter l'utilisateur
            this.currentUserSubject.next(null);
            this.router.navigate(['/auth/login']);
            return throwError(() => error);
          })
        );
    }
  }

  ngOnDestroy(): void {
    // Arrêter le système de refresh automatique
    this.stopAutoRefresh();
  }
}
