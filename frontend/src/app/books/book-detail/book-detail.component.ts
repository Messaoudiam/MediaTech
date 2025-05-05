import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../core/components/navbar/navbar.component';
import { BookService, Resource } from '../../core/services/book.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../auth/services/auth.service';
import { ImageService } from '../../core/services/image.service';
import { switchMap, catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NavbarComponent,
  ],
})
export class BookDetailComponent implements OnInit {
  book: Resource | null = null;
  loading = true;
  error = false;
  isFavorite = false;
  isLoggedIn = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private favoriteService: FavoriteService,
    private notificationService: NotificationService,
    private authService: AuthService,
    public imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Vérifier l'état d'authentification (juste pour mettre à jour l'état, pas pour bloquer l'accès)
    this.checkAuthStatus();
    // Charger les détails du livre, accessible à tous
    this.loadBookDetails();
  }

  private checkAuthStatus(): void {
    // Vérifier si l'utilisateur est connecté via le service
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.isLoggedIn = !!user;

      // Vérification de secours via localStorage
      if (!this.isLoggedIn) {
        this.isLoggedIn = !!localStorage.getItem('token');
      }

      // Si l'utilisateur est connecté, vérifier l'état des favoris
      if (this.isLoggedIn && this.book) {
        this.checkFavoriteStatus(this.book.id);
      }
    });
  }

  private loadBookDetails(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            return of(null);
          }
          return this.bookService.getBookById(id).pipe(
            catchError((error) => {
              console.error(error);
              this.error = true;
              this.loading = false;
              this.notificationService.error('Livre non trouvé');
              return of(null);
            })
          );
        })
      )
      .subscribe((book) => {
        this.book = book;
        this.loading = false;

        if (book) {
          // Afficher la notification pour tous les utilisateurs
          this.notificationService.info(`Vous consultez ${book.title}`);

          // Vérifier l'état des favoris seulement si l'utilisateur est connecté
          if (this.isLoggedIn) {
            this.checkFavoriteStatus(book.id);
          }
        }
      });
  }

  private checkFavoriteStatus(bookId: string): void {
    if (!this.isLoggedIn) return;

    this.favoriteService
      .isResourceFavorite(bookId)
      .subscribe((isFavorite: boolean) => {
        this.isFavorite = isFavorite;
      });
  }

  goBack(): void {
    // Toujours rediriger vers la liste des livres
    this.router.navigate(['/books/all']);
  }

  toggleFavorite(): void {
    // Vérification de l'authentification uniquement pour les fonctionnalités réservées
    if (!this.isLoggedIn) {
      this.notificationService.warning(
        'Veuillez vous connecter pour ajouter des livres à vos favoris'
      );
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.book) return;

    if (this.isFavorite) {
      this.favoriteService.removeFavorite(this.book.id).subscribe(() => {
        this.isFavorite = false;
        this.notificationService.info('Retiré des favoris');
      });
    } else {
      this.favoriteService.addFavorite(this.book.id).subscribe(() => {
        this.isFavorite = true;
        this.notificationService.success('Ajouté aux favoris');
      });
    }
  }

  borrowBook(): void {
    // Vérification de l'authentification uniquement pour les fonctionnalités réservées
    if (!this.isLoggedIn) {
      this.notificationService.warning(
        'Veuillez vous connecter pour emprunter des livres'
      );
      this.router.navigate(['/auth/login']);
      return;
    }

    this.notificationService.warning(
      "Fonctionnalité d'emprunt à venir bientôt"
    );
  }

  /**
   * Obtenir l'URL complète de l'image depuis Supabase
   */
  getBookCoverUrl(coverImageUrl: string | undefined): string {
    return this.imageService.getSafeImageUrl(coverImageUrl || '');
  }

  /**
   * Gérer les erreurs de chargement d'image
   */
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.imageService.getSafeImageUrl('');
    }
  }
}
