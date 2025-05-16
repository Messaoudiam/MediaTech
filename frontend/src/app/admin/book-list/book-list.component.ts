import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  BookService,
  Resource,
  ResourceType,
} from '../../core/services/book.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../dialogs/confirm-dialog/confirm-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
})
export class BookListComponent implements OnInit {
  books: Resource[] = [];
  filteredBooks: Resource[] = [];
  displayedColumns: string[] = [];
  loading = true;
  selectedType: string = '';
  resourceTypes: string[] = [];

  constructor(
    private bookService: BookService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.loadResources();
    this.loadResourceTypes();
    this.setupDisplayColumns();
  }

  private setupDisplayColumns(): void {
    // Observer les changements de taille d'écran
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .subscribe((result) => {
        // Colonnes de base pour mobile (xs et small)
        if (
          result.matches &&
          (result.breakpoints[Breakpoints.XSmall] ||
            result.breakpoints[Breakpoints.Small])
        ) {
          this.displayedColumns = [
            'coverImage',
            'title',
            'type',
            'availableCopies',
            'actions',
          ];
        }
        // Colonnes pour tablette (medium)
        else if (result.matches && result.breakpoints[Breakpoints.Medium]) {
          this.displayedColumns = [
            'coverImage',
            'title',
            'author',
            'type',
            'availableCopies',
            'borrowedCopies',
            'actions',
          ];
        }
        // Toutes les colonnes pour desktop (large et xl)
        else {
          this.displayedColumns = [
            'coverImage',
            'title',
            'author',
            'publisher',
            'publishedYear',
            'genre',
            'language',
            'type',
            'totalCopies',
            'availableCopies',
            'borrowedCopies',
            'actions',
          ];
        }
      });
  }

  loadResources(): void {
    this.loading = true;
    this.bookService.getAllResourcesWithCopies().subscribe({
      next: (resources) => {
        this.books = resources;
        this.filteredBooks = [...this.books];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des ressources:', error);
        this.loading = false;
        this.snackBar.open(
          'Erreur lors du chargement des ressources',
          'Fermer',
          { duration: 3000 }
        );
      },
    });
  }

  loadResourceTypes(): void {
    // Utiliser les types d'énumération directement
    this.resourceTypes = Object.values(ResourceType);
  }

  filterByType(type: string): void {
    if (!type) {
      this.filteredBooks = [...this.books];
    } else {
      this.filteredBooks = this.books.filter(
        (book) => book.type.toLowerCase() === type.toLowerCase()
      );
    }
  }

  addNewBook(): void {
    this.router.navigate(['/admin/add-book']);
  }

  editBook(id: string): void {
    this.router.navigate(['/admin/edit-book', id]);
  }

  viewBookDetails(id: string): void {
    this.router.navigate(['/books', id]);
  }

  deleteBook(book: Resource): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la ressource',
        message: `Êtes-vous sûr de vouloir supprimer "${book.title}" ? Cette action est irréversible.`,
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
      } as ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.bookService.deleteBook(book.id).subscribe({
          next: () => {
            this.books = this.books.filter((b) => b.id !== book.id);
            this.filterByType(this.selectedType);
            this.snackBar.open('Ressource supprimée avec succès', 'Fermer', {
              duration: 3000,
            });
          },
          error: (error: any) => {
            console.error('Erreur lors de la suppression:', error);
            let errorMessage = 'Erreur lors de la suppression de la ressource';

            if (error.status === 409) {
              errorMessage =
                'Impossible de supprimer cette ressource car des exemplaires sont actuellement empruntés';
            }

            this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
          },
        });
      }
    });
  }

  getTotalCopies(book: Resource): number {
    return book.copies ? book.copies.length : 0;
  }

  getAvailableCopies(book: Resource): number {
    return book.copies ? book.copies.filter((c) => c.available).length : 0;
  }

  getBorrowedCopies(book: Resource): number {
    return book.copies ? book.copies.filter((c) => !c.available).length : 0;
  }
}
