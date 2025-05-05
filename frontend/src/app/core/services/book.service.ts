import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap, delay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CopyService, Copy } from './copy.service';

// Mise à jour pour utiliser Resource au lieu de Book
export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  author?: string;
  isbn?: string;
  coverImageUrl?: string;
  description: string;
  publishedYear?: number;
  genre?: string;
  pageCount?: number;
  publisher?: string;
  language?: string;
  publishedAt?: string;
  copies?: Copy[];
}

export enum ResourceType {
  BOOK = 'BOOK',
  COMIC = 'COMIC',
  DVD = 'DVD',
  GAME = 'GAME',
  MAGAZINE = 'MAGAZINE',
  AUDIOBOOK = 'AUDIOBOOK',
}

// Pour la rétrocompatibilité, on conserve l'interface Book
export interface Book extends Omit<Resource, 'type'> {
  // Book est simplement une Resource de type BOOK
}

export interface SearchHistoryItem {
  id: string;
  book: Resource;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private apiUrl = `${environment.apiUrl}/resources`;

  // Clé pour stocker l'historique dans le localStorage
  private historyStorageKey = 'book_search_history';

  constructor(private http: HttpClient, private copyService: CopyService) {}

  getAllResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(this.apiUrl);
  }

  getResourcesByType(type: ResourceType): Observable<Resource[]> {
    const params = new HttpParams().set('type', type);
    return this.http.get<Resource[]>(this.apiUrl, { params });
  }

  getAllBooks(): Observable<Resource[]> {
    // Récupérer les ressources de type BOOK
    const params = new HttpParams().set('type', ResourceType.BOOK);
    return this.http.get<Resource[]>(this.apiUrl, { params }).pipe(
      switchMap((books) => {
        console.log('Livres récupérés du backend:', books);
        if (books.length === 0) {
          return of([]);
        }

        // Récupérer les copies pour chaque livre
        const booksWithCopies$ = books.map((book) =>
          this.copyService.getCopiesByResourceId(book.id).pipe(
            map((copies) => {
              console.log(`Copies récupérées pour ${book.title}:`, copies);
              return {
                ...book,
                copies: copies,
              };
            }),
            catchError((error) => {
              console.error(
                `Erreur lors de la récupération des copies pour ${book.title}:`,
                error
              );
              return of({
                ...book,
                copies: [],
              });
            })
          )
        );

        return forkJoin(booksWithCopies$) as Observable<Resource[]>;
      })
    );
  }

  getAllResourcesWithCopies(): Observable<Resource[]> {
    // Récupérer toutes les ressources
    console.log('Récupération de toutes les ressources avec leurs exemplaires');
    return this.http.get<Resource[]>(this.apiUrl).pipe(
      switchMap((resources) => {
        console.log(`${resources.length} ressources récupérées du backend`);
        if (resources.length === 0) {
          return of([]);
        }

        // Pour chaque ressource, récupérer ses exemplaires
        const resourcesWithCopies$ = resources.map((resource) =>
          this.copyService.getCopiesByResourceId(resource.id).pipe(
            map((copies) => {
              const totalCopies = copies.length;
              const availableCopies = copies.filter((c) => c.available).length;
              const borrowedCopies = copies.filter((c) => !c.available).length;

              console.log(
                `Ressource "${resource.title}": ` +
                  `${totalCopies} exemplaires, ` +
                  `${availableCopies} disponibles, ` +
                  `${borrowedCopies} empruntés`
              );

              // Retourner une ressource enrichie avec ses exemplaires
              return {
                ...resource,
                copies: copies,
              };
            }),
            catchError((error) => {
              console.error(
                `Erreur lors de la récupération des copies pour ${resource.title}:`,
                error
              );
              // En cas d'erreur, retourner la ressource avec un tableau vide d'exemplaires
              return of({
                ...resource,
                copies: [],
              });
            })
          )
        );

        // Combiner tous les observables en un seul qui émet un tableau de ressources avec leurs exemplaires
        return forkJoin(resourcesWithCopies$) as Observable<Resource[]>;
      })
    );
  }

  getBookById(id: string): Observable<Resource> {
    // D'abord récupérer les informations du livre
    return this.http.get<Resource>(`${this.apiUrl}/${id}`).pipe(
      switchMap((book) => {
        // Ensuite récupérer les exemplaires associés à ce livre
        return this.copyService.getCopiesByResourceId(id).pipe(
          map((copies) => {
            // Intégrer les exemplaires dans l'objet livre
            return {
              ...book,
              copies: copies,
            };
          }),
          catchError((error) => {
            console.error(
              `Erreur lors de la récupération des exemplaires pour ${id}:`,
              error
            );
            // En cas d'erreur, retourner le livre sans ses exemplaires
            return of(book);
          })
        );
      })
    );
  }

  addBook(book: Omit<Resource, 'id'>, coverFile?: File): Observable<Resource> {
    // Utilisation de FormData pour envoyer le fichier d'image
    const formData = new FormData();

    // Ajout des champs au FormData
    Object.entries(book).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'coverImage') {
        formData.append(key, String(value));
      }
    });

    // Si un fichier de couverture est fourni, l'ajouter au FormData
    if (coverFile) {
      formData.append('coverImage', coverFile, coverFile.name);
    }
    // Sinon, vérifier si coverImage est présent dans l'objet book
    else if ((book as any).coverImage) {
      formData.append('coverImage', (book as any).coverImage);
    }

    return this.http.post<Resource>(this.apiUrl, formData).pipe(
      catchError((error) => {
        console.error("Erreur lors de l'ajout de la ressource:", error);
        throw error;
      })
    );
  }

  updateBook(
    id: string,
    book: Partial<Resource>,
    coverFile?: File
  ): Observable<Resource> {
    // Utilisation de FormData pour envoyer le fichier d'image
    const formData = new FormData();

    // Ajout des champs au FormData
    Object.entries(book).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'coverImage') {
        // Cas spécial pour removeCoverImage pour s'assurer qu'il est une chaîne
        if (key === 'removeCoverImage') {
          formData.append(key, String(value));
          console.log(
            "DEBUG - Demande de suppression de l'image envoyée:",
            String(value)
          );
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Si un fichier de couverture est fourni, l'ajouter au FormData
    if (coverFile) {
      formData.append('coverImage', coverFile, coverFile.name);
    }
    // Sinon, vérifier si coverImage est présent dans l'objet book
    else if ((book as any).coverImage) {
      formData.append('coverImage', (book as any).coverImage);
    }

    // Afficher les données qui seront envoyées
    console.log('DEBUG - Données du FormData:');
    formData.forEach((value, key) => {
      console.log(`${key}: ${value instanceof File ? value.name : value}`);
    });

    return this.http.patch<Resource>(`${this.apiUrl}/${id}`, formData).pipe(
      catchError((error) => {
        console.error(
          `Erreur lors de la mise à jour de la ressource ${id}:`,
          error
        );
        // Ajouter plus de détails sur l'erreur
        if (error.status === 400 && error.error) {
          console.error("Détails de l'erreur:", error.error);
        }
        throw error;
      })
    );
  }

  deleteBook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(
          `Erreur lors de la suppression de la ressource ${id}:`,
          error
        );
        throw error;
      })
    );
  }

  searchBooks(query: string): Observable<Resource[]> {
    const params = new HttpParams()
      .set('search', query)
      .set('type', ResourceType.BOOK);

    return this.http.get<Resource[]>(this.apiUrl, { params });
  }

  // Méthodes pour gérer l'historique de recherche

  getSearchHistory(): SearchHistoryItem[] {
    const historyJson = localStorage.getItem(this.historyStorageKey);
    if (!historyJson) {
      return [];
    }

    try {
      return JSON.parse(historyJson) as SearchHistoryItem[];
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique:", error);
      return [];
    }
  }

  addToSearchHistory(book: Resource): void {
    const history = this.getSearchHistory();

    // Vérifier si le livre est déjà dans l'historique
    const existingIndex = history.findIndex((item) => item.book.id === book.id);

    if (existingIndex !== -1) {
      // Si le livre existe déjà, le supprimer pour le remettre en haut de la liste
      history.splice(existingIndex, 1);
    }

    // Ajouter le livre en haut de l'historique
    history.unshift({
      id: this.generateUniqueId(),
      book,
      timestamp: Date.now(),
    });

    // Limiter l'historique à 10 éléments
    const limitedHistory = history.slice(0, 10);

    // Sauvegarder l'historique
    localStorage.setItem(
      this.historyStorageKey,
      JSON.stringify(limitedHistory)
    );
  }

  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  removeFromSearchHistory(itemId: string): void {
    const history = this.getSearchHistory();
    const updatedHistory = history.filter((item) => item.id !== itemId);
    localStorage.setItem(
      this.historyStorageKey,
      JSON.stringify(updatedHistory)
    );
  }

  clearSearchHistory(): void {
    localStorage.removeItem(this.historyStorageKey);
  }
}
