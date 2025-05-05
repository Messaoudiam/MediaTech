import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { BookService, Resource } from '../core/services/book.service';
import { ImageService } from '../core/services/image.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
  ],
})
export class LandingComponent implements OnInit {
  allBooks: Resource[] = [];
  displayedBooks: Resource[] = [];
  loading = true;
  error = false;

  // Variables pour le carrousel
  currentPage = 0;
  itemsPerPage = 3;
  totalPages = 0;

  constructor(
    private bookService: BookService,
    public imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  private loadBooks(): void {
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.allBooks = books;
        this.totalPages = Math.ceil(this.allBooks.length / this.itemsPerPage);
        this.updateDisplayedBooks();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des livres:', error);
        this.error = true;
        this.loading = false;
      },
    });
  }

  // Méthodes pour gérer le carrousel
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.updateDisplayedBooks();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateDisplayedBooks();
    }
  }

  updateDisplayedBooks(): void {
    const startIndex = this.currentPage * this.itemsPerPage;
    this.displayedBooks = this.allBooks.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  // Vérifier si on peut naviguer aux pages précédente/suivante
  canGoToPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  canGoToNextPage(): boolean {
    return this.currentPage < this.totalPages - 1;
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
