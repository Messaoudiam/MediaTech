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
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
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
import { environment } from '../../../environments/environment';

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
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss'],
})
export class BookListComponent implements OnInit {
  books: Resource[] = [];
  filteredBooks: Resource[] = [];
  loading = false;
  debugMode = !environment.production; // Mode débogage activé seulement en développement

  // Colonnes par défaut (toutes les colonnes)
  allColumns: string[] = [
    'coverImage',
    'title',
    'author',
    'publisher',
    'publishedYear',
    'genre',
    'language',
    'director',
    'actors',
    'duration',
    'developer',
    'platform',
    'pegiRating',
    'issueNumber',
    'frequency',
    'type',
    'totalCopies',
    'availableCopies',
    'borrowedCopies',
    'actions',
  ];

  // Colonnes actuellement affichées
  displayedColumns: string[] = [
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

  resourceTypes = Object.values(ResourceType);
  selectedType: string = '';

  constructor(
    private bookService: BookService,
    private router: Router,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  /**
   * Charge toutes les ressources avec leurs exemplaires associés
   */
  loadBooks(): void {
    this.loading = true;
    this.bookService.getAllResourcesWithCopies().subscribe({
      next: (resources) => {
        // Filtrer uniquement les livres si nécessaire
        this.books = resources;
        this.filteredBooks = resources;

        console.log(
          `${resources.length} ressources chargées dans BookListComponent`
        );

        // Journaliser des statistiques sur les exemplaires
        let totalCopies = 0;
        let availableCopies = 0;
        let borrowedCopies = 0;

        resources.forEach((resource) => {
          const resourceTotalCopies = this.getTotalCopies(resource);
          const resourceAvailableCopies = this.getAvailableCopies(resource);
          const resourceBorrowedCopies = this.getBorrowedCopies(resource);

          totalCopies += resourceTotalCopies;
          availableCopies += resourceAvailableCopies;
          borrowedCopies += resourceBorrowedCopies;

          // Journaliser des détails plus précis sur les copies
          if (resource.copies && resource.copies.length > 0) {
            console.log(`Copies pour "${resource.title}":`);
            resource.copies.forEach((copy) => {
              console.log(
                `  - ID: ${copy.id.substring(0, 8)}, disponible: ${
                  copy.available
                }, condition: ${copy.condition}`
              );
            });
          }

          console.log(
            `Ressource "${resource.title}": ${resourceTotalCopies} exemplaires, ` +
              `${resourceAvailableCopies} disponibles, ${resourceBorrowedCopies} empruntés`
          );
        });

        console.log(
          `Total: ${totalCopies} exemplaires, ` +
            `${availableCopies} disponibles, ${borrowedCopies} empruntés`
        );

        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des ressources:', error);
        this.loading = false;
        this.notificationService.error(
          'Erreur lors du chargement des ressources'
        );
      },
    });
  }

  /**
   * Filtre les ressources par type et ajuste les colonnes affichées
   * @param type Le type de ressource à filtrer
   */
  filterByType(type: string): void {
    this.selectedType = type;

    // Filtrer les ressources par type
    if (!type) {
      this.filteredBooks = this.books;
      // Afficher les colonnes par défaut si aucun filtre n'est appliqué
      this.setDefaultColumns();
    } else {
      this.filteredBooks = this.books.filter(
        (book) => book.type === (type as ResourceType)
      );
      // Ajuster les colonnes en fonction du type sélectionné
      this.adjustColumnsForType(type as ResourceType);
    }
  }

  /**
   * Définit les colonnes à afficher en fonction du type de ressource
   * @param type Le type de ressource
   */
  adjustColumnsForType(type: ResourceType): void {
    // Colonnes de base présentes pour tous les types
    const baseColumns = [
      'coverImage',
      'title',
      'type',
      'totalCopies',
      'availableCopies',
      'borrowedCopies',
      'actions',
    ];

    let specificColumns: string[] = [];

    switch (type) {
      case ResourceType.BOOK:
      case ResourceType.AUDIOBOOK:
        specificColumns = [
          'author',
          'publisher',
          'publishedYear',
          'genre',
          'language',
        ];
        break;

      case ResourceType.COMIC:
        specificColumns = [
          'author',
          'publisher',
          'publishedYear',
          'genre',
          'language',
        ];
        break;

      case ResourceType.DVD:
        specificColumns = [
          'director',
          'actors',
          'duration',
          'genre',
          'language',
        ];
        break;

      case ResourceType.GAME:
        specificColumns = [
          'developer',
          'platform',
          'pegiRating',
          'genre',
          'language',
        ];
        break;

      case ResourceType.MAGAZINE:
        specificColumns = [
          'issueNumber',
          'frequency',
          'publisher',
          'publishedYear',
          'language',
        ];
        break;

      default:
        this.setDefaultColumns();
        return;
    }

    // Fusion des colonnes de base et spécifiques
    this.displayedColumns = [
      ...baseColumns.slice(0, 2),
      ...specificColumns,
      ...baseColumns.slice(2),
    ];
  }

  /**
   * Réinitialise les colonnes aux valeurs par défaut
   */
  setDefaultColumns(): void {
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

  /**
   * Calcule le nombre total d'exemplaires pour une ressource
   * @param resource La ressource pour laquelle calculer le nombre d'exemplaires
   * @returns Le nombre total d'exemplaires
   */
  getTotalCopies(resource: Resource): number {
    if (!resource || !resource.copies || !Array.isArray(resource.copies)) {
      return 0;
    }
    // S'assurer que nous comptons uniquement les objets valides
    return resource.copies.filter(
      (copy) => copy && typeof copy === 'object' && 'id' in copy
    ).length;
  }

  /**
   * Calcule le nombre d'exemplaires disponibles pour une ressource
   * @param resource La ressource pour laquelle calculer le nombre d'exemplaires disponibles
   * @returns Le nombre d'exemplaires disponibles
   */
  getAvailableCopies(resource: Resource): number {
    if (!resource || !resource.copies || !Array.isArray(resource.copies)) {
      return 0;
    }
    // Ne compter que les exemplaires valides et disponibles
    return resource.copies.filter(
      (copy) =>
        copy &&
        typeof copy === 'object' &&
        'available' in copy &&
        copy.available === true
    ).length;
  }

  /**
   * Calcule le nombre d'exemplaires empruntés pour une ressource
   * @param resource La ressource pour laquelle calculer le nombre d'exemplaires empruntés
   * @returns Le nombre d'exemplaires empruntés
   */
  getBorrowedCopies(resource: Resource): number {
    if (!resource || !resource.copies || !Array.isArray(resource.copies)) {
      return 0;
    }
    // Ne compter que les exemplaires valides et non disponibles (empruntés)
    return resource.copies.filter(
      (copy) =>
        copy &&
        typeof copy === 'object' &&
        'available' in copy &&
        copy.available === false
    ).length;
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
