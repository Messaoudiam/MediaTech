import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  BookService,
  Resource,
  ResourceType,
} from '../../core/services/book.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss'],
})
export class BookListComponent implements OnInit {
  books: Resource[] = [];
  loading = false;
  displayedColumns: string[] = [
    'coverImage',
    'title',
    'author',
    'publisher',
    'publishedYear',
    'genre',
    'language',
    'type',
    'actions',
  ];

  constructor(
    private bookService: BookService,
    private router: Router,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.loading = true;
    this.bookService.getAllBooks().subscribe({
      next: (books) => {
        this.books = books;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des livres:', error);
        this.loading = false;
        this.notificationService.error('Erreur lors du chargement des livres');
      },
    });
  }

  editBook(bookId: string): void {
    this.router.navigate(['/admin/edit-book', bookId]);
  }

  viewBookDetails(bookId: string): void {
    this.router.navigate(['/books', bookId]);
  }

  deleteBook(book: Resource): void {
    const dialogData: ConfirmDialogData = {
      title: 'Supprimer cette ressource ?',
      message: `Êtes-vous sûr de vouloir supprimer "${book.title}" de la bibliothèque ?`,
      confirmButtonText: 'OK',
      cancelButtonText: 'Annuler',
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData,
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = true;
        this.bookService.deleteBook(book.id).subscribe({
          next: () => {
            this.loading = false;
            this.notificationService.success('Ressource supprimée avec succès');
            this.loadBooks();
          },
          error: (error) => {
            this.loading = false;
            console.error(
              'Erreur lors de la suppression de la ressource:',
              error
            );
            this.notificationService.error(
              'Erreur lors de la suppression de la ressource'
            );
          },
        });
      }
    });
  }

  addNewBook(): void {
    this.router.navigate(['/admin/add-book']);
  }
}
