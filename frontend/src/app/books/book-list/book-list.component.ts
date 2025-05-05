import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BookService, Resource } from '../../core/services/book.service';
import { ImageService } from '../../core/services/image.service';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
})
export class BookListComponent implements OnInit {
  books: Resource[] = [];
  filteredBooks: Resource[] = [];
  loading = true;
  error = false;

  // Pagination
  pageSize = 12;
  pageSizeOptions = [6, 12, 24, 48];
  pageIndex = 0;
  totalBooks = 0;

  constructor(
    private bookService: BookService,
    public imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.loading = true;
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.books = books;
        this.totalBooks = books.length;
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

  updateDisplayedBooks(): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.filteredBooks = this.books.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedBooks();
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.imageService.getSafeImageUrl('');
    }
  }

  /**
   * Obtenir l'URL complète de l'image depuis Supabase
   */
  getBookCoverUrl(coverImageUrl: string | undefined): string {
    return this.imageService.getSafeImageUrl(coverImageUrl || '');
  }
}
