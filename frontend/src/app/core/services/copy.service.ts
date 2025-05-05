import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

export interface Copy {
  id: string;
  resourceId: string;
  available: boolean;
  condition: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CopyService {
  private apiUrl = `${environment.apiUrl}/copies`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  // Obtenir les exemplaires d'une ressource
  getCopiesByResourceId(resourceId: string): Observable<Copy[]> {
    console.log(
      `Récupération des exemplaires pour la ressource: ${resourceId}`
    );

    // URL plus explicite qui correspond à l'API backend
    const url = `${this.apiUrl}/resource/${resourceId}`;
    console.log('URL appelée:', url);

    return this.http
      .get<Copy[]>(url, {
        withCredentials: true,
      })
      .pipe(
        tap((copies) => {
          console.log(
            `${copies.length} exemplaires récupérés pour ${resourceId}`
          );
          if (copies.length > 0) {
            console.log('Premier exemplaire:', copies[0]);
            // Afficher le statut de chaque exemplaire pour débogage
            const disponibles = copies.filter((c) => c.available).length;
            const empruntes = copies.filter((c) => !c.available).length;
            console.log(
              `Statut des exemplaires pour ${resourceId}: ${disponibles} disponibles, ${empruntes} empruntés`
            );
            console.log(
              'Disponibilité des exemplaires:',
              copies.map((c) => c.available)
            );
          }
        }),
        catchError((error) => {
          console.error(
            `Erreur lors de la récupération des exemplaires pour ${resourceId}:`,
            error
          );
          // Vérifier si c'est une erreur de connexion
          if (error.status === 0) {
            console.error('Problème de connexion au serveur');
          } else if (error.status === 404) {
            console.error("Endpoint non trouvé, vérifier l'URL:", url);
          }
          return this.handleError(error);
        })
      );
  }

  // Ajouter un nouvel exemplaire
  addCopy(resourceId: string, condition: string): Observable<Copy> {
    const payload = {
      resourceId,
      condition,
      available: true,
    };

    console.log("Ajout d'un exemplaire avec les données:", payload);

    // Assurons-nous que l'en-tête Content-Type est défini correctement
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: true,
    };

    return this.http.post<Copy>(this.apiUrl, payload, httpOptions).pipe(
      tap((newCopy) => console.log('Exemplaire ajouté avec succès:', newCopy)),
      catchError(this.handleError.bind(this))
    );
  }

  // Supprimer un exemplaire
  deleteCopy(copyId: string): Observable<any> {
    console.log(`Suppression de l'exemplaire: ${copyId}`);
    return this.http
      .delete(`${this.apiUrl}/${copyId}`, { withCredentials: true })
      .pipe(
        tap(() => console.log(`Exemplaire ${copyId} supprimé avec succès`)),
        catchError(this.handleError.bind(this))
      );
  }

  // Gestionnaire d'erreurs
  private handleError(error: HttpErrorResponse) {
    console.error('Erreur dans CopyService:', error);

    // Log détaillé des erreurs de l'API
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      console.error('Erreur client:', error.error.message);
    } else {
      // Erreur côté serveur
      console.error(
        `Code erreur backend: ${error.status}, ` +
          `message: ${error.error?.message || 'Message inconnu'}, ` +
          `détails: ${JSON.stringify(error.error)}`
      );

      // Rediriger vers la page de connexion en cas d'erreur d'authentification
      if (error.status === 401 || error.status === 403) {
        console.log(
          "Erreur d'authentification, redirection vers la page de connexion"
        );
        // Utiliser la méthode de déconnexion du service d'authentification
        this.authService.logout().subscribe(() => {
          this.router.navigate(['/auth/login']);
        });
      }
    }

    return throwError(() => error);
  }
}
