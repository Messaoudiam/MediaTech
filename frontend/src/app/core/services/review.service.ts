import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Review,
  CreateReviewDto,
  UpdateReviewDto,
} from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) {}

  // Créer un avis
  createReview(createReviewDto: CreateReviewDto): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, createReviewDto);
  }

  // Récupérer tous les avis
  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.apiUrl);
  }

  // Récupérer les avis pour une ressource spécifique
  getReviewsByResource(resourceId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/resource/${resourceId}`);
  }

  // Récupérer l'avis de l'utilisateur connecté pour une ressource spécifique
  getUserReviewForResource(resourceId: string): Observable<Review> {
    return this.http.get<Review>(`${this.apiUrl}/user/resource/${resourceId}`);
  }

  // Mettre à jour un avis
  updateReview(
    resourceId: string,
    updateReviewDto: UpdateReviewDto
  ): Observable<Review> {
    return this.http.patch<Review>(
      `${this.apiUrl}/resource/${resourceId}`,
      updateReviewDto
    );
  }

  // Supprimer un avis
  deleteReview(resourceId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/resource/${resourceId}`);
  }
}
