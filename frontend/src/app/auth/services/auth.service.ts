// angular
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

// rxjs
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

// models
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Configuration de l'API - Assurez-vous que le port est le même que celui du backend
  private readonly API_URL = 'http://localhost:3000/api';
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
    console.log('AuthService initialisé - Mode API réelle:', this.USE_REAL_API);
    console.log("URL de l'API:", this.API_URL);

    // Au démarrage, vérifier si l'utilisateur est connecté
    this.checkAuthStatus();
  }

  // Vérifie l'état d'authentification au démarrage
  private checkAuthStatus(): void {
    if (this.USE_REAL_API) {
      console.log("Vérification de l'état d'authentification...");
      this.http
        .get<any>(`${this.API_URL}/auth/check-auth`, {
          withCredentials: true,
        })
        .subscribe({
          next: (response) => {
            console.log('Réponse de check-auth:', response);
            if (response) {
              console.log('Authentifié, récupération du profil...');
              this.getUserProfile().subscribe();
            }
          },
          error: (err) => {
            console.log(
              "Erreur de vérification d'authentification:",
              err.status
            );
            // Si on reçoit une erreur 401, on n'est pas authentifié
            if (err.status === 401) {
              console.log('Non authentifié, redirection vers login');
              this.router.navigate(['/auth/login']);
            }
          },
        });
    }
  }

  // Redirige l'utilisateur vers le dashboard approprié en fonction de son rôle
  private redirectBasedOnRole(user: User): void {
    console.log('Redirection basée sur le rôle:', user.role);

    if (!user || !user.role) {
      console.log('Aucun rôle défini, redirection vers login');
      this.router.navigate(['/auth/login']);
      return;
    }

    // Normaliser le rôle pour la comparaison (ignorer la casse)
    const userRole = user.role.toLowerCase();
    console.log('Rôle normalisé pour comparaison:', userRole);

    // Vérifier l'URL actuelle pour éviter les redirections en boucle
    const currentUrl = this.router.url;
    console.log('URL actuelle:', currentUrl);

    // Si l'utilisateur est déjà sur le bon dashboard, ne pas rediriger
    if (
      (userRole === 'admin' && currentUrl === '/admin') ||
      (userRole === 'user' && currentUrl === '/home')
    ) {
      console.log('Utilisateur déjà sur le bon dashboard, pas de redirection');
      return;
    }

    setTimeout(() => {
      if (userRole === 'admin') {
        console.log('Rôle admin détecté, redirection vers dashboard admin');
        this.router.navigate(['/admin']).then(
          (success) => console.log('Redirection admin réussie:', success),
          (error) => console.error('Erreur de redirection admin:', error)
        );
      } else {
        console.log(
          'Rôle utilisateur détecté, redirection vers dashboard user'
        );
        this.router.navigate(['/home']).then(
          (success) => console.log('Redirection utilisateur réussie:', success),
          (error) => console.error('Erreur de redirection utilisateur:', error)
        );
      }
    }, 100);
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('Méthode login appelée avec:', credentials);

    if (!credentials.email || !credentials.password) {
      console.error('Identifiants de connexion incomplets');
      return throwError(
        () => new Error('Identifiants de connexion incomplets')
      );
    }

    if (!this.USE_REAL_API) {
      // Mode démo - simulation de connexion
      console.log('Mode démo - simulation de connexion');
      const mockResponse = {
        user: this.mockUser,
        token: 'fake-jwt-token',
        access_token: 'fake-access-token',
        message: 'Connexion réussie',
      };

      return of(mockResponse).pipe(
        tap((response) => {
          console.log('Mode démo - connexion réussie:', response);
          this.currentUserSubject.next(response.user);
          // Redirection basée sur le rôle
          this.redirectBasedOnRole(response.user);
        })
      );
    } else {
      // Version réelle avec API
      console.log(
        'Mode API réelle - tentative de connexion:',
        credentials.email
      );
      return this.http
        .post<AuthResponse>(`${this.API_URL}/auth/login`, credentials, {
          withCredentials: true,
        })
        .pipe(
          tap((response) => {
            console.log('Réponse du serveur après connexion:', response);
            if (response && response.user) {
              console.log('Utilisateur connecté:', response.user);
              this.currentUserSubject.next(response.user);

              // Redirection basée sur le rôle
              this.redirectBasedOnRole(response.user);
            } else {
              console.error('Réponse invalide ou sans utilisateur:', response);
            }
          }),
          catchError((error) => {
            console.error('Erreur lors de la connexion:', error);
            console.error('Statut:', error.status);
            console.error('Message:', error.error?.message || error.message);

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
    console.log('Début de la création de compte avec:', userData);

    // Vérifier si toutes les propriétés requises sont présentes
    if (!userData.email || !userData.password || !userData.confirmPassword) {
      console.error("Données d'inscription incomplètes", userData);
      return of(null as any).pipe(
        tap(() => {
          throw new Error("Données d'inscription incomplètes");
        })
      );
    }

    if (!this.USE_REAL_API) {
      // Mode démo - simulation d'inscription
      console.log("Mode démo activé - pas d'enregistrement en base de données");

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
          console.log('Compte créé avec succès en mode démo:', response.user);
          this.currentUserSubject.next(response.user);
          this.router.navigate(['/home']);
        })
      );
    } else {
      // Version réelle avec API
      const url = `${this.API_URL}/auth/register`;
      console.log('Mode API réelle - Envoi de la requête au backend:', url);
      console.log('Données envoyées:', userData);

      return this.http
        .post<AuthResponse>(url, userData, {
          withCredentials: true, // Important pour les cookies
        })
        .pipe(
          tap((response) => {
            console.log('Réponse du backend après inscription:', response);
            if (response && response.user) {
              this.currentUserSubject.next(response.user);
              this.redirectBasedOnRole(response.user);
            }
          }),
          catchError((error) => {
            console.error("Erreur lors de l'inscription:", error);
            // Log des détails de l'erreur
            console.error("Message d'erreur:", error.message);
            console.error('Statut:', error.status);
            console.error('URL qui a échoué:', error.url);
            throw error;
          })
        );
    }
  }

  logout(): Observable<any> {
    if (!this.USE_REAL_API) {
      // Mode démo - simulation de déconnexion
      return of(null).pipe(
        tap(() => {
          console.log('Déconnexion en mode démo...');
          this.currentUserSubject.next(null);
          console.log('Redirection vers la page de login...');
          this.router.navigate(['/auth/login']).then(
            (success) => console.log('Redirection réussie:', success),
            (error) => console.error('Erreur de redirection:', error)
          );
        })
      );
    } else {
      // Version réelle avec API
      console.log('Tentative de déconnexion via API...');
      return this.http
        .post(
          `${this.API_URL}/auth/logout`,
          {},
          {
            withCredentials: true, // Important pour les cookies
          }
        )
        .pipe(
          tap((response) => {
            console.log('Réponse de déconnexion:', response);
            console.log(
              'Déconnexion réussie via API, suppression du contexte utilisateur...'
            );

            // Réinitialiser l'état local
            this.currentUserSubject.next(null);

            // Rediriger vers la page de login
            this.router.navigate(['/auth/login']).then(
              (success) =>
                console.log('Redirection après déconnexion réussie:', success),
              (error) =>
                console.error('Erreur de redirection après déconnexion:', error)
            );
          }),
          catchError((error) => {
            console.error('Erreur lors de la déconnexion via API:', error);
            console.log("Déconnexion locale effectuée malgré l'erreur");

            // Réinitialiser l'état local même en cas d'erreur
            this.currentUserSubject.next(null);

            // Rediriger vers la page de login
            this.router.navigate(['/auth/login']).then(
              (success) =>
                console.log('Redirection après erreur réussie:', success),
              (error) =>
                console.error(
                  'Erreur de redirection après erreur de déconnexion:',
                  error
                )
            );

            return of(null);
          })
        );
    }
  }

  isAuthenticated(): Observable<boolean> {
    // Vérifier d'abord localement
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      return of(true);
    }

    if (!this.USE_REAL_API) {
      // Mode démo - pas d'appel API
      return of(false);
    } else {
      // Vérifier avec le serveur
      return this.http
        .get<boolean>(`${this.API_URL}/auth/check-auth`, {
          withCredentials: true, // Important pour les cookies
        })
        .pipe(
          tap((isAuth) => {
            if (isAuth) {
              // Si authentifié, récupérer le profil
              this.getUserProfile().subscribe();
            }
          }),
          catchError(() => of(false))
        );
    }
  }

  getUserProfile(): Observable<User> {
    if (!this.USE_REAL_API) {
      // Mode démo - retourner un utilisateur fictif
      return of(this.mockUser).pipe(
        tap((user) => {
          this.currentUserSubject.next(user);
        })
      );
    } else {
      // Version réelle avec API
      console.log("Appel de l'API pour récupérer le profil utilisateur");

      // Utiliser l'URL /auth/profile
      return this.http
        .get<User>(`${this.API_URL}/auth/profile`, {
          withCredentials: true, // Important pour les cookies
        })
        .pipe(
          tap((user) => {
            console.log('Profil utilisateur récupéré:', user);
            if (user) {
              this.currentUserSubject.next(user);
            }
          }),
          catchError((error) => {
            console.error('Erreur lors de la récupération du profil:', error);
            if (error.status === 401) {
              this.router.navigate(['/auth/login']);
            }
            return of(null as any);
          })
        );
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Fonction pour réinitialiser le verrouillage d'un compte
  resetAccountLock(email: string): Observable<any> {
    if (!this.USE_REAL_API) {
      return of({ message: 'Compte déverrouillé (mode démo)' });
    }

    console.log('Tentative de réinitialisation du verrouillage pour:', email);

    // Vous devez créer cet endpoint sur votre backend
    return this.http
      .post(
        `${this.API_URL}/auth/reset-lock`,
        { email },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          console.log('Réponse de réinitialisation de verrouillage:', response);
        }),
        catchError((error) => {
          console.error(
            'Erreur lors de la réinitialisation du verrouillage:',
            error
          );
          return throwError(() => error);
        })
      );
  }
}
