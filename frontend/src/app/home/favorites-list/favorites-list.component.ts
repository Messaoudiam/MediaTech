import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FavoriteService } from '../../core/services/favorite.service';
import { NotificationService } from '../../core/services/notification.service';
import { Resource } from '../../core/services/book.service';
import { ImageService } from '../../core/services/image.service';

@Component({
  selector: 'app-favorites-list',
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
],
  template: `
    <div class="favorites-container">
      <h2 class="section-title">Mes Livres Favoris</h2>
    
      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Chargement de vos favoris...</p>
        </div>
      }
    
      @if (!loading && favoriteBooks.length === 0) {
        <div class="empty-state">
          <mat-icon>favorite_border</mat-icon>
          <p>Vous n'avez pas encore de livres favoris</p>
          <a mat-raised-button color="primary" routerLink="/books/all">
            Découvrir des livres
          </a>
        </div>
      }
    
      @if (!loading && favoriteBooks.length > 0) {
        <div class="favorites-grid">
          @for (book of favoriteBooks; track book) {
            <mat-card class="book-card">
              <img
                mat-card-image
                [src]="imageService.getSafeImageUrl(book.coverImageUrl || '')"
                [alt]="book.title"
                class="book-cover"
                />
                <mat-card-content>
                  <h3 class="book-title">{{ book.title }}</h3>
                  <p class="book-author">{{ book.author }}</p>
                </mat-card-content>
                <mat-card-actions>
                  <a mat-button color="primary" [routerLink]="['/books', book.id]">
                    <mat-icon>visibility</mat-icon>
                    Voir détails
                  </a>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="removeFavorite(book.id)"
                    >
                    <mat-icon>favorite</mat-icon>
                  </button>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      </div>
    `,
  styles: [
    `
      .favorites-container {
        padding: 1rem;
      }

      .section-title {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        color: #333;
        border-bottom: 2px solid #3f51b5;
        padding-bottom: 0.5rem;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;

        p {
          margin-top: 1rem;
          color: #666;
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        text-align: center;

        mat-icon {
          font-size: 3rem;
          height: 3rem;
          width: 3rem;
          color: #ccc;
          margin-bottom: 1rem;
        }

        p {
          color: #666;
          margin-bottom: 1.5rem;
        }
      }

      .favorites-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 1rem;
      }

      .book-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        transition: transform 0.2s ease;

        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .book-cover {
          height: 200px;
          object-fit: cover;
        }

        mat-card-content {
          flex-grow: 1;
        }

        .book-title {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .book-author {
          font-size: 0.9rem;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        mat-card-actions {
          display: flex;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class FavoritesListComponent implements OnInit {
  favoriteBooks: Resource[] = [];
  loading = true;

  constructor(
    private favoriteService: FavoriteService,
    private notificationService: NotificationService,
    public imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.loading = true;
    this.favoriteService.getFavoriteResources().subscribe({
      next: (books) => {
        this.favoriteBooks = books;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des favoris:', error);
        this.notificationService.error('Impossible de charger vos favoris');
        this.loading = false;
      },
    });
  }

  removeFavorite(bookId: string): void {
    this.favoriteService.removeFavorite(bookId).subscribe({
      next: () => {
        this.favoriteBooks = this.favoriteBooks.filter(
          (book) => book.id !== bookId
        );
        this.notificationService.info('Livre retiré des favoris');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du favori:', error);
        this.notificationService.error(
          'Impossible de retirer ce livre des favoris'
        );
      },
    });
  }
}
