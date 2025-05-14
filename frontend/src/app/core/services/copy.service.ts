import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

export interface Resource {
  id: string;
  title: string;
  author: string;
}

export interface Copy {
  id: string;
  resourceId: string;
  available: boolean;
  condition: string;
  createdAt: string;
  updatedAt: string;
  resource?: Resource;
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

  // Récupérer tous les exemplaires disponibles
  getAvailableCopies(): Observable<Copy[]> {
    console.log('Récupération des exemplaires disponibles');
    const url = `${this.apiUrl}?available=true`;
    console.log('URL appelée:', url);

    return this.http.get<Copy[]>(url, { withCredentials: true }).pipe(
      tap((copies) => {
        console.log(`${copies.length} exemplaires disponibles récupérés:`);
        console.log('Exemplaires disponibles:', copies);

        // Vérifier si les ressources sont incluses
        const withResource = copies.filter(
          (copy) => copy && copy.resource && copy.resource.title
        ).length;

        console.log(
          `Nombre d'exemplaires avec information ressource: ${withResource}/${copies.length}`
        );

        if (
          copies.length > 0 &&
          (!copies[0].resource || !copies[0].resource.title)
        ) {
          console.warn(
            'ATTENTION: Les informations de ressource semblent manquantes dans les copies'
          );
        }
      }),
      catchError((error) => {
        console.error(
          'Erreur lors de la récupération des exemplaires disponibles:',
          error
        );
        return this.handleError(error);
      })
    );
  }

  // Récupérer tous les exemplaires disponibles avec les informations complètes des ressources
  getAvailableCopiesWithResources(): Observable<Copy[]> {
    console.log('DEBUG - getAvailableCopiesWithResources - Démarrage');
    const url = `${this.apiUrl}?available=true`;
    console.log('DEBUG - URL appelée:', url);

    // Approche directe sans switchMap pour simplifier le débogage
    return this.http.get<Copy[]>(url, { withCredentials: true }).pipe(
      tap((copies) => {
        console.log(
          `DEBUG - ${copies.length} exemplaires disponibles récupérés du backend`
        );
        if (copies.length === 0) {
          console.warn('DEBUG - ATTENTION: Aucun exemplaire disponible trouvé');
        } else {
          console.log('DEBUG - Premier exemplaire:', JSON.stringify(copies[0]));
        }

        // Vérifier les resources
        let withResource = 0;
        copies.forEach((copy, index) => {
          if (copy.resource && copy.resource.title) {
            withResource++;
          } else {
            console.warn(
              `DEBUG - Exemplaire #${index + 1} (${
                copy.id
              }) sans information de ressource complète`
            );
          }
        });
        console.log(
          `DEBUG - ${withResource}/${copies.length} exemplaires ont des informations de ressource complètes`
        );
      }),
      catchError((error) => {
        console.error(
          'DEBUG - Erreur lors de la récupération des exemplaires:',
          error
        );
        return throwError(() => error);
      })
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
