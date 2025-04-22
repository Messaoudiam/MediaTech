import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverImageUrl?: string;
  description?: string;
  publishedYear?: number;
  genre?: string;
  pageCount?: number;
  publisher?: string;
  language?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private apiUrl = `${environment.apiUrl}/books`;

  // Données fictives pour le développement
  private mockBooks: Book[] = [
    {
      id: '1',
      title: 'Le Seigneur des Anneaux',
      author: 'J.R.R. Tolkien',
      isbn: '9782267011258',
      coverImageUrl:
        'https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg',
      description:
        "L'histoire épique de la Terre du Milieu, où Frodon Sacquet doit détruire l'Anneau Unique pour sauver le monde de l'emprise de Sauron.",
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
        'Dans un monde totalitaire dominé par Big Brother, Winston Smith tente de préserver son humanité et sa liberté de pensée.',
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
  ];

  constructor(private http: HttpClient) {}

  getAllBooks(): Observable<Book[]> {
    // En production, utiliser cette ligne :
    // return this.http.get<Book[]>(this.apiUrl)

    // Pour le développement, utiliser les données mockées :
    return of(this.mockBooks);
  }

  getBookById(id: string): Observable<Book> {
    // En production, utiliser cette ligne :
    // return this.http.get<Book>(`${this.apiUrl}/${id}`)

    // Pour le développement, utiliser les données mockées :
    const book = this.mockBooks.find((b) => b.id === id);
    if (book) {
      return of(book);
    }
    return of(null).pipe(
      map(() => {
        throw new Error(`Livre avec l'ID ${id} non trouvé`);
      })
    );
  }

  addBook(book: Omit<Book, 'id'>): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book).pipe(
      catchError((error) => {
        console.error("Erreur lors de l'ajout du livre:", error);
        throw error;
      })
    );
  }

  updateBook(id: string, book: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, book).pipe(
      catchError((error) => {
        console.error(`Erreur lors de la mise à jour du livre ${id}:`, error);
        throw error;
      })
    );
  }

  deleteBook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Erreur lors de la suppression du livre ${id}:`, error);
        throw error;
      })
    );
  }

  searchBooks(query: string): Observable<Book[]> {
    // En production, utiliser cette ligne :
    // return this.http.get<Book[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`)

    // Pour le développement, utiliser les données mockées :
    const results = this.mockBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase()) ||
        (book.genre && book.genre.toLowerCase().includes(query.toLowerCase()))
    );
    return of(results);
  }
}
