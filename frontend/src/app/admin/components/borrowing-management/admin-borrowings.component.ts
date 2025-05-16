import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  Borrowing,
  BorrowingResponse,
  BorrowingService,
  BorrowingStatus,
} from '../../../core/services/borrowing.service';
import { NotificationService } from '../../../core/services/notification.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-borrowings',
  templateUrl: './admin-borrowings.component.html',
  styleUrls: ['./admin-borrowings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
})
export class AdminBorrowingsComponent implements OnInit {
  displayedColumns: string[] = [
    'coverImage',
    'title',
    'user',
    'borrowedAt',
    'dueDate',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<Borrowing>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = false;
  currentStatus?: BorrowingStatus;
  selectedTabIndex = 0;

  BorrowingStatus = BorrowingStatus; // Pour l'accès dans le template

  constructor(
    private borrowingService: BorrowingService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBorrowings();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;

    switch (event.index) {
      case 0: // Tous
        this.currentStatus = undefined;
        break;
      case 1: // Actifs
        this.currentStatus = BorrowingStatus.ACTIVE;
        break;
      case 2: // En retard
        this.currentStatus = BorrowingStatus.OVERDUE;
        break;
      case 3: // Retournés
        this.currentStatus = BorrowingStatus.RETURNED;
        break;
    }

    this.loadBorrowings();
  }

  loadBorrowings(): void {
    this.loading = true;
    console.log('Chargement des emprunts avec le statut:', this.currentStatus);

    this.borrowingService
      .getAllBorrowings(this.currentStatus)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des emprunts:', error);
          this.notificationService.error('Impossible de charger les emprunts');
          return of({
            items: [],
            total: 0,
            page: 1,
            pageSize: 10,
            pageCount: 0,
          });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((response: BorrowingResponse) => {
        console.log('Emprunts reçus:', response.items);
        this.dataSource.data = response.items;
      });
  }

  returnBorrowing(borrowingId: string, event: Event): void {
    event.stopPropagation(); // Empêcher la navigation

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de retour',
        message:
          'Êtes-vous sûr de vouloir marquer cet emprunt comme retourné ?',
        confirmButtonText: 'Confirmer',
        cancelButtonText: 'Annuler',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.processReturnBorrowing(borrowingId);
      }
    });
  }

  private processReturnBorrowing(borrowingId: string): void {
    this.loading = true;
    this.borrowingService
      .returnBorrowing(borrowingId)
      .pipe(
        catchError((error) => {
          console.error("Erreur lors du retour de l'emprunt:", error);
          this.notificationService.error('Impossible de retourner cet emprunt');
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((result) => {
        if (result) {
          this.notificationService.success('Emprunt retourné avec succès');
          this.loadBorrowings();
        }
      });
  }

  checkOverdueBorrowings(): void {
    this.loading = true;
    this.borrowingService
      .checkOverdueBorrowings()
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la vérification des retards:', error);
          this.notificationService.error(
            'Impossible de vérifier les emprunts en retard'
          );
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((result) => {
        if (result) {
          this.notificationService.success(
            `${result.updated} emprunt(s) marqué(s) comme en retard`
          );
          this.loadBorrowings();
        }
      });
  }

  formatDueDate(dueDate: string): { text: string; isOverdue: boolean } {
    return this.borrowingService.formatDueDate(dueDate);
  }

  getStatusClass(status: BorrowingStatus): string {
    switch (status) {
      case BorrowingStatus.ACTIVE:
        return 'status-active';
      case BorrowingStatus.OVERDUE:
        return 'status-overdue';
      case BorrowingStatus.RETURNED:
        return 'status-returned';
      default:
        return '';
    }
  }

  getStatusText(status: BorrowingStatus): string {
    switch (status) {
      case BorrowingStatus.ACTIVE:
        return 'Actif';
      case BorrowingStatus.OVERDUE:
        return 'En retard';
      case BorrowingStatus.RETURNED:
        return 'Retourné';
      default:
        return status;
    }
  }
}
