import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Book } from './book.service';
import { AuthService } from '../../auth/services/auth.service';

export interface Favorite {
  id: string;
  userId: string;
  bookId: string;
  createdAt: Date;
  book?: Book;
}

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  private apiUrl = `${environment.apiUrl}/favorites`;

  // Données fictives pour le développement
  private mockFavorites: Favorite[] = [];
  private currentUserId: string = 'current-user'; // Valeur par défaut

  constructor(private http: HttpClient, private authService: AuthService) {
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$.subscribe((user) => {
      if (user && user.id) {
        this.currentUserId = user.id;
        this.loadFavoritesFromStorage();
      }
    });

    // Charger les favoris depuis le localStorage pour le développement
    this.loadFavoritesFromStorage();
  }

  private loadFavoritesFromStorage(): void {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      try {
        this.mockFavorites = JSON.parse(storedFavorites);
        console.log(
          'Favoris chargés depuis le localStorage:',
          this.mockFavorites
        );
      } catch (e) {
        console.error('Erreur lors du chargement des favoris:', e);
        this.mockFavorites = [];
      }
    }
  }

  /**
   * Récupère tous les favoris de l'utilisateur connecté
   */
  getUserFavorites(): Observable<Favorite[]> {
    // En production, utiliser cette ligne :
    // return this.http.get<Favorite[]>(`${this.apiUrl}/user`)

    // Pour le développement, utiliser les données mockées et filtrer par userId
    const userFavorites = this.mockFavorites.filter(
      (fav) => fav.userId === this.currentUserId
    );
    return of(userFavorites);
  }

  /**
   * Vérifie si un livre est dans les favoris
   * @param bookId Identifiant du livre
   */
  isBookFavorite(bookId: string): Observable<boolean> {
    // En production, utiliser cette ligne :
    // return this.http.get<boolean>(`${this.apiUrl}/check/${bookId}`)

    // Pour le développement :
    const exists = this.mockFavorites.some(
      (fav) => fav.bookId === bookId && fav.userId === this.currentUserId
    );
    console.log(`Vérification si le livre ${bookId} est en favori:`, exists);
    return of(exists);
  }

  /**
   * Ajoute un livre aux favoris
   * @param bookId Identifiant du livre
   */
  addFavorite(bookId: string): Observable<Favorite> {
    // En production, utiliser cette ligne :
    // return this.http.post<Favorite>(this.apiUrl, { bookId })

    // Pour le développement :
    // Vérifier si le livre est déjà dans les favoris
    if (
      this.mockFavorites.some(
        (fav) => fav.bookId === bookId && fav.userId === this.currentUserId
      )
    ) {
      return of(
        this.mockFavorites.find(
          (fav) => fav.bookId === bookId && fav.userId === this.currentUserId
        ) as Favorite
      );
    }

    // Créer un nouveau favori
    const newFavorite: Favorite = {
      id: Math.random().toString(36).substring(2, 15),
      userId: this.currentUserId,
      bookId,
      createdAt: new Date(),
    };

    this.mockFavorites.push(newFavorite);
    localStorage.setItem('favorites', JSON.stringify(this.mockFavorites));
    console.log(`Livre ${bookId} ajouté aux favoris`);

    return of(newFavorite);
  }

  /**
   * Supprime un livre des favoris
   * @param bookId Identifiant du livre
   */
  removeFavorite(bookId: string): Observable<void> {
    // En production, utiliser cette ligne :
    // return this.http.delete<void>(`${this.apiUrl}/${bookId}`)

    // Pour le développement :
    const index = this.mockFavorites.findIndex(
      (fav) => fav.bookId === bookId && fav.userId === this.currentUserId
    );
    if (index !== -1) {
      this.mockFavorites.splice(index, 1);
      localStorage.setItem('favorites', JSON.stringify(this.mockFavorites));
      console.log(`Livre ${bookId} retiré des favoris`);
    }

    return of(undefined);
  }

  /**
   * Récupère les livres favoris avec leurs détails
   */
  getFavoriteBooks(): Observable<Book[]> {
    // Cette méthode est utile pour afficher les livres favoris dans le dashboard
    // En production, on utiliserait une requête spécifique qui retourne les livres favoris avec leurs détails
    // return this.http.get<Book[]>(`${this.apiUrl}/books`)

    // Pour le développement, simulons la récupération des livres :
    const favoriteBookIds = this.mockFavorites
      .filter((fav) => fav.userId === this.currentUserId)
      .map((fav) => fav.bookId);

    console.log('IDs des livres favoris:', favoriteBookIds);

    const favoriteBooks: Book[] = [
      {
        id: '1',
        title: 'Le Seigneur des Anneaux',
        author: 'J.R.R. Tolkien',
        isbn: '9782267011258',
        coverImageUrl:
          'https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg',
        description: "L'histoire épique de la Terre du Milieu.",
        publishedYear: 1954,
        genre: 'Fantasy',
        pageCount: 1178,
        publisher: 'Allen & Unwin',
        language: 'Français',
      },
      {
        id: '2',
        title: '1984',
        author: 'George Orwell',
        isbn: '9782070368228',
        coverImageUrl:
          'https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg',
        description:
          'Dans un monde totalitaire dominé par Big Brother, Winston Smith tente de préserver son humanité.',
        publishedYear: 1949,
        genre: 'Dystopie',
        pageCount: 328,
        publisher: 'Secker & Warburg',
        language: 'Français',
      },
      {
        id: '3',
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '9782266233200',
        coverImageUrl:
          'https://m.media-amazon.com/images/I/81aA7hEEykL._AC_UF1000,1000_QL80_.jpg',
        description:
          "Sur la planète désertique Arrakis, Paul Atréides est au centre d'une lutte pour le contrôle de la ressource la plus précieuse de l'univers : l'Épice.",
        publishedYear: 1965,
        genre: 'Science-Fiction',
        pageCount: 896,
        publisher: 'Chilton Books',
        language: 'Français',
      },
    ].filter((book) => favoriteBookIds.includes(book.id));

    console.log('Livres favoris récupérés:', favoriteBooks);

    return of(favoriteBooks);
  }
}
