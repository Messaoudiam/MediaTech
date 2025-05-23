import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Resource } from './book.service';
import { AuthService } from '../../auth/services/auth.service';

export interface Favorite {
  id: string;
  userId: string;
  resourceId: string;
  createdAt: Date;
  resource?: Resource;
}

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  private apiUrl = `${environment.apiUrl}/resources`;

  // BehaviorSubject pour suivre l'état des favoris
  private favoritesSubject = new BehaviorSubject<string[]>([]);
  private favoriteStatusCache = new Map<string, boolean>();
  private favoritesLoaded = false;

  constructor(private http: HttpClient, private authService: AuthService) {
    // Charger l'état initial des favoris lorsqu'un utilisateur est connecté
    this.authService.isAuthenticated().subscribe((isAuthenticated) => {
      if (isAuthenticated && !this.favoritesLoaded) {
        this.loadFavoritesIds();
      } else if (!isAuthenticated) {
        // Réinitialiser le cache quand l'utilisateur se déconnecte
        this.resetCache();
      }
    });
  }

  /**
   * Réinitialise le cache des favoris
   */
  private resetCache(): void {
    this.favoritesSubject.next([]);
    this.favoriteStatusCache.clear();
    this.favoritesLoaded = false;
  }

  /**
   * Charge les IDs des ressources favorites
   */
  private loadFavoritesIds(): void {
    this.getFavoriteResources().subscribe({
      next: (favorites) => {
        const favoriteIds = favorites.map((fav) => fav.id);
        this.favoritesSubject.next(favoriteIds);

        // Mettre à jour le cache
        favoriteIds.forEach((id) => this.favoriteStatusCache.set(id, true));
        this.favoritesLoaded = true;
        console.log('Cache des favoris chargé:', favoriteIds);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des IDs favoris:', error);
        this.favoritesLoaded = true; // Éviter les tentatives répétées
      },
    });
  }

  /**
   * Récupère tous les favoris de l'utilisateur connecté
   */
  getUserFavorites(): Observable<Favorite[]> {
    return this.http
      .get<Favorite[]>(`${environment.apiUrl}/users/favorites`)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la récupération des favoris:', error);
          return of([]); // Retourner un tableau vide en cas d'erreur
        })
      );
  }

  /**
   * Vérifie si une ressource est dans les favoris
   * @param resourceId Identifiant de la ressource
   */
  isResourceFavorite(resourceId: string): Observable<boolean> {
    // Vérifier d'abord dans notre cache local
    if (this.favoriteStatusCache.has(resourceId)) {
      const isFavorite = this.favoriteStatusCache.get(resourceId) || false;
      console.log(
        `Status favori depuis le cache pour ${resourceId}:`,
        isFavorite
      );
      return of(isFavorite);
    }

    // Si pas de cache et que les favoris sont chargés, on peut déduire que ce n'est pas un favori
    if (this.favoritesLoaded) {
      const isFavorite = this.favoritesSubject.value.includes(resourceId);
      this.favoriteStatusCache.set(resourceId, isFavorite);
      console.log(`Status favori déduit pour ${resourceId}:`, isFavorite);
      return of(isFavorite);
    }

    // En dernier recours, faire l'appel API
    return this.http
      .get<boolean>(`${environment.apiUrl}/users/favorites/check/${resourceId}`)
      .pipe(
        tap((isFavorite) => {
          // Mettre à jour le cache
          this.favoriteStatusCache.set(resourceId, isFavorite);
          console.log(
            `Status favori depuis l'API pour ${resourceId}:`,
            isFavorite
          );

          // Mettre à jour la liste des favoris si nécessaire
          if (isFavorite && !this.favoritesSubject.value.includes(resourceId)) {
            const currentFavorites = this.favoritesSubject.value;
            this.favoritesSubject.next([...currentFavorites, resourceId]);
          }
        }),
        catchError((error) => {
          console.error(
            `Erreur lors de la vérification du favori ${resourceId}:`,
            error
          );
          // En cas d'erreur, utiliser le cache ou retourner false
          const cachedValue = this.favoriteStatusCache.get(resourceId);
          if (cachedValue !== undefined) {
            return of(cachedValue);
          }
          // Vérifier dans la liste des favoris chargés
          const isFavorite = this.favoritesSubject.value.includes(resourceId);
          this.favoriteStatusCache.set(resourceId, isFavorite);
          return of(isFavorite);
        })
      );
  }

  /**
   * Observer les changements dans les favoris pour un ID spécifique
   * @param resourceId L'ID de la ressource à surveiller
   */
  observeFavoriteStatus(resourceId: string): Observable<boolean> {
    return this.favoritesSubject.pipe(
      map((favorites) => favorites.includes(resourceId))
    );
  }

  /**
   * Ajoute une ressource aux favoris
   * @param resourceId Identifiant de la ressource
   */
  addFavorite(resourceId: string): Observable<Favorite> {
    return this.http
      .post<Favorite>(`${this.apiUrl}/${resourceId}/favorite`, {})
      .pipe(
        tap(() => {
          // Mettre à jour le cache immédiatement
          this.favoriteStatusCache.set(resourceId, true);

          // Mettre à jour la liste des favoris
          const currentFavorites = this.favoritesSubject.value;
          if (!currentFavorites.includes(resourceId)) {
            this.favoritesSubject.next([...currentFavorites, resourceId]);
          }
          console.log(`Favori ajouté: ${resourceId}`);
        }),
        catchError((error) => {
          console.error(
            `Erreur lors de l'ajout aux favoris ${resourceId}:`,
            error
          );
          throw error;
        })
      );
  }

  /**
   * Supprime une ressource des favoris
   * @param resourceId Identifiant de la ressource
   */
  removeFavorite(resourceId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${resourceId}/favorite`).pipe(
      tap(() => {
        // Mettre à jour le cache immédiatement
        this.favoriteStatusCache.set(resourceId, false);

        // Mettre à jour la liste des favoris
        const currentFavorites = this.favoritesSubject.value;
        this.favoritesSubject.next(
          currentFavorites.filter((id) => id !== resourceId)
        );
        console.log(`Favori retiré: ${resourceId}`);
      }),
      catchError((error) => {
        console.error(
          `Erreur lors de la suppression du favori ${resourceId}:`,
          error
        );
        throw error;
      })
    );
  }

  /**
   * Récupère les ressources favorites avec leurs détails
   */
  getFavoriteResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.apiUrl}/user/favorites`).pipe(
      tap((resources) => {
        // Mettre à jour le cache avec les ressources récupérées
        const favoriteIds = resources.map((resource) => resource.id);
        this.favoritesSubject.next(favoriteIds);
        favoriteIds.forEach((id) => this.favoriteStatusCache.set(id, true));
        console.log('Ressources favorites récupérées:', favoriteIds);
      }),
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération des ressources favorites:',
          error
        );
        return of([]); // Retourner un tableau vide en cas d'erreur
      })
    );
  }

  /**
   * Pour la rétrocompatibilité avec le code existant
   */
  getFavoriteBooks(): Observable<Resource[]> {
    return this.getFavoriteResources();
  }
}
