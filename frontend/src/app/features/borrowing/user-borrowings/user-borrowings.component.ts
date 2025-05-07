import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import {
  Borrowing,
  BorrowingService,
  BorrowingStatus,
} from '../../../core/services/borrowing.service';
import { NotificationService } from '../../../core/services/notification.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-user-borrowings',
  templateUrl: './user-borrowings.component.html',
  styleUrls: ['./user-borrowings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
})
export class UserBorrowingsComponent implements OnInit {
  borrowings: Borrowing[] = [];
  loading = false;
  selectedTabIndex = 0;
  BorrowingStatus = BorrowingStatus; // Pour l'accès dans le template

  constructor(
    private borrowingService: BorrowingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadBorrowings();
  }

  loadBorrowings(status?: BorrowingStatus): void {
    this.loading = true;
    this.borrowingService
      .getUserBorrowings(status)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des emprunts:', error);
          this.notificationService.error('Impossible de charger vos emprunts');
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((borrowings) => {
        this.borrowings = borrowings;
      });
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;

    switch (event.index) {
      case 0: // Tous
        this.loadBorrowings();
        break;
      case 1: // Actifs
        this.loadBorrowings(BorrowingStatus.ACTIVE);
        break;
      case 2: // En retard
        this.loadBorrowings(BorrowingStatus.OVERDUE);
        break;
      case 3: // Retournés
        this.loadBorrowings(BorrowingStatus.RETURNED);
        break;
    }
  }

  renewBorrowing(borrowingId: string, event: Event): void {
    event.stopPropagation(); // Empêcher la propagation de l'événement

    this.borrowingService
      .renewBorrowing(borrowingId)
      .pipe(
        catchError((error) => {
          console.error("Erreur lors du renouvellement de l'emprunt:", error);
          this.notificationService.error(
            'Impossible de renouveler cet emprunt'
          );
          return of(null);
        })
      )
      .subscribe((result) => {
        if (result) {
          this.notificationService.success('Emprunt renouvelé avec succès');
          // Recharger les emprunts pour mettre à jour la liste
          this.loadBorrowings(
            this.selectedTabIndex === 0
              ? undefined
              : this.selectedTabIndex === 1
              ? BorrowingStatus.ACTIVE
              : this.selectedTabIndex === 2
              ? BorrowingStatus.OVERDUE
              : BorrowingStatus.RETURNED
          );
        }
      });
  }

  returnBorrowing(borrowingId: string, event: Event): void {
    event.stopPropagation(); // Empêcher la propagation de l'événement

    this.borrowingService
      .returnBorrowing(borrowingId)
      .pipe(
        catchError((error) => {
          console.error("Erreur lors du retour de l'emprunt:", error);
          this.notificationService.error('Impossible de retourner cet emprunt');
          return of(null);
        })
      )
      .subscribe((result) => {
        if (result) {
          this.notificationService.success('Livre retourné avec succès');
          // Recharger les emprunts pour mettre à jour la liste
          this.loadBorrowings(
            this.selectedTabIndex === 0
              ? undefined
              : this.selectedTabIndex === 1
              ? BorrowingStatus.ACTIVE
              : this.selectedTabIndex === 2
              ? BorrowingStatus.OVERDUE
              : BorrowingStatus.RETURNED
          );
        }
      });
  }

  getDaysRemaining(dueDate: string): number {
    return this.borrowingService.getDaysRemaining(dueDate);
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
