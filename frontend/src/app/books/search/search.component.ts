import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import {
  BookService,
  Resource,
  ResourceType,
} from '../../core/services/book.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
})
export class SearchComponent implements OnInit {
  searchQuery = '';
  books: Resource[] = [];
  loading = false;
  noResults = false;
  resourceType = ResourceType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['query']) {
        this.searchQuery = params['query'];
        this.searchBooks();
      }
    });
  }

  searchBooks(): void {
    if (!this.searchQuery.trim()) {
      this.books = [];
      this.noResults = false;
      return;
    }

    this.loading = true;
    this.noResults = false;

    this.bookService.searchBooks(this.searchQuery).subscribe({
      next: (results) => {
        this.books = results;
        this.noResults = results.length === 0;
        this.loading = false;

        // Mettre à jour l'URL avec la nouvelle requête
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { query: this.searchQuery },
          queryParamsHandling: 'merge',
        });
      },
      error: (error) => {
        console.error('Erreur lors de la recherche de livres:', error);
        this.loading = false;
        this.noResults = true;
      },
    });
  }

  getResourceIcon(type: ResourceType): string {
    switch (type) {
      case ResourceType.BOOK:
        return 'book';
      case ResourceType.COMIC:
        return 'import_contacts';
      case ResourceType.DVD:
        return 'movie';
      case ResourceType.GAME:
        return 'sports_esports';
      case ResourceType.MAGAZINE:
        return 'newspaper';
      case ResourceType.AUDIOBOOK:
        return 'headphones';
      default:
        return 'description';
    }
  }

  getResourceRoute(resource: Resource): string[] {
    switch (resource.type) {
      case ResourceType.BOOK:
      case ResourceType.COMIC:
      case ResourceType.AUDIOBOOK:
        return ['/books', resource.id];
      case ResourceType.DVD:
        return ['/dvds', resource.id];
      case ResourceType.GAME:
        return ['/games', resource.id];
      case ResourceType.MAGAZINE:
        return ['/magazines', resource.id];
      default:
        return ['/resources', resource.id];
    }
  }

  viewBookDetails(bookId: string): void {
    this.router.navigate(['/books', bookId]);
  }

  viewResourceDetails(resource: Resource): void {
    this.router.navigate(this.getResourceRoute(resource));
  }
}
