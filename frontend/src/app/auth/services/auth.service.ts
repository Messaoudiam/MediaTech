// angular
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

// rxjs
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';

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
export class AuthService {
  // Configuration de l'API depuis l'environnement
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Flag pour activer le mode API réelle (à true) ou démo (à false)
  private readonly USE_REAL_API = true;

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
  }

  // Vérifie l'état d'authentification au démarrage
  private checkAuthStatus(): void {
    if (this.USE_REAL_API) {
      // Vérifier l'authentification avec le backend, quelle que soit la page
      this.http
        .get<{ user: User }>(`${this.API_URL}/auth/check-auth`, {
          withCredentials: true,
        })
        .pipe(
          tap((response) => {
            if (response && response.user) {
              console.log('Session restaurée après démarrage/rafraîchissement');
              this.currentUserSubject.next(response.user);
            }
          }),
          catchError(() => {
            // En cas d'erreur (non connecté), vérifier si on est sur une page protégée
            const currentUrl = this.router.url;
            if (
              currentUrl !== '/landing' &&
              !currentUrl.startsWith('/books/') &&
              currentUrl !== '/' &&
              !currentUrl.startsWith('/search') &&
              !currentUrl.startsWith('/auth/')
            ) {
              // Rediriger vers login seulement si on est sur une page protégée
              this.router.navigate(['/auth/login']);
            }
            return of(null);
          })
        )
        .subscribe();
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
              this.currentUserSubject.next(response.user);

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
    // Vérifier si toutes les propriétés requises sont présentes
    if (!userData.email || !userData.password || !userData.confirmPassword) {
      return throwError(() => new Error("Données d'inscription incomplètes"));
    }

    if (!this.USE_REAL_API) {
      // Mode démo - simulation d'inscription

      return of({
        user: {
          ...this.mockUser,
          nom: userData.nom || 'Utilisateur',
          prenom: userData.prenom || 'Démo',
          email: userData.email,
        },
        token: 'fake-jwt-token',
        message: 'Inscription réussie (mode démo)',
      }).pipe(
        tap((response) => {
          this.currentUserSubject.next(response.user);
          this.router.navigate(['/home']);
        })
      );
    } else {
      // Version réelle avec API
      const url = `${this.API_URL}/auth/register`;

      return this.http
        .post<AuthResponse>(url, userData, {
          withCredentials: true, // Important pour les cookies
        })
        .pipe(
          tap((response) => {
            if (response && response.user) {
              this.currentUserSubject.next(response.user);
              this.redirectBasedOnRole(response.user);
            }
          }),
          catchError((error) => {
            return throwError(() => error);
          })
        );
    }
  }

  logout(): Observable<any> {
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
}
