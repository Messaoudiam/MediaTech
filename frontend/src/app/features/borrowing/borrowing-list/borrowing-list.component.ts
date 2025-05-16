import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { ConfirmDialogComponent } from '../../../admin/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-borrowing-list',
  templateUrl: './borrowing-list.component.html',
  styleUrls: ['./borrowing-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
})
export class BorrowingListComponent implements OnInit {
  displayedColumns: string[] = [
    'title',
    'user',
    'borrowedAt',
    'dueDate',
    'status',
    'actions',
  ];
  dataSource: MatTableDataSource<Borrowing> = new MatTableDataSource<Borrowing>(
    []
  );

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  totalItems = 0;
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  loading = false;
  statusFilter: BorrowingStatus | null = null;
  searchQuery = '';

  BorrowingStatus = BorrowingStatus; // Pour utiliser dans le template

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

  loadBorrowings(): void {
    this.loading = true;
    this.borrowingService
      .getAllBorrowings(
        this.statusFilter || undefined,
        this.searchQuery || undefined,
        this.currentPage + 1,
        this.pageSize
      )
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des emprunts:', error);
          this.notificationService.error(
            'Impossible de charger la liste des emprunts'
          );
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
        this.dataSource.data = response.items;
        this.totalItems = response.total;
      });
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadBorrowings();
  }

  returnBorrowing(borrowingId: string): void {
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

  formatDueDate(dueDate: string): { text: string; isOverdue: boolean } {
    return this.borrowingService.formatDueDate(dueDate);
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

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBorrowings();
  }

  clearFilters(): void {
    this.statusFilter = null;
    this.searchQuery = '';
    this.currentPage = 0;
    this.loadBorrowings();
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
