import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { FavoriteService } from '../../core/services/favorite.service';
import { Resource } from '../../core/services/book.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent implements OnInit {
  loading = true;
  favorites: Resource[] = [];

  constructor(
    private favoriteService: FavoriteService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.loading = true;
    this.favoriteService.getFavoriteResources().subscribe({
      next: (data) => {
        this.favorites = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des favoris', error);
        this.snackBar.open('Erreur lors du chargement des favoris', 'Fermer', {
          duration: 3000,
        });
        this.loading = false;
      },
    });
  }

  removeFavorite(id: string): void {
    this.favoriteService.removeFavorite(id).subscribe({
      next: () => {
        this.favorites = this.favorites.filter((fav) => fav.id !== id);
        this.snackBar.open('Livre retiré des favoris', 'Fermer', {
          duration: 3000,
        });
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression du favori', error);
        this.snackBar.open(
          'Erreur lors de la suppression du favori',
          'Fermer',
          {
            duration: 3000,
          }
        );
      },
    });
  }
}
