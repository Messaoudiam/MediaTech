import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Récupère tous les favoris de l'utilisateur connecté
   */
  getUserFavorites(): Observable<Favorite[]> {
    return this.http
      .get<Favorite[]>(`${environment.apiUrl}/users/favorites`)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la récupération des favoris:', error);
          throw error;
        })
      );
  }

  /**
   * Vérifie si une ressource est dans les favoris
   * @param resourceId Identifiant de la ressource
   */
  isResourceFavorite(resourceId: string): Observable<boolean> {
    return this.http
      .get<boolean>(`${environment.apiUrl}/users/favorites/check/${resourceId}`)
      .pipe(
        catchError((error) => {
          console.error(
            `Erreur lors de la vérification du favori ${resourceId}:`,
            error
          );
          throw error;
        })
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
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération des ressources favorites:',
          error
        );
        throw error;
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
