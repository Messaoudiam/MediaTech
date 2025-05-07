import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import {
  Borrowing,
  BorrowingService,
  BorrowingStatus,
} from '../../../core/services/borrowing.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../auth/services/auth.service';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-borrowing-detail',
  templateUrl: './borrowing-detail.component.html',
  styleUrls: ['./borrowing-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule,
  ],
})
export class BorrowingDetailComponent implements OnInit {
  borrowing: Borrowing | null = null;
  loading = true;
  BorrowingStatus = BorrowingStatus;
  error = false;
  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private borrowingService: BorrowingService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadBorrowing();
  }

  private checkUserRole(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.isAdmin = user?.role === 'ADMIN';
    });
  }

  private loadBorrowing(): void {
    this.loading = true;
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            this.router.navigate(['/borrowings']);
            return of(null);
          }
          return this.borrowingService.getBorrowingById(id).pipe(
            catchError((error) => {
              console.error("Erreur lors du chargement de l'emprunt:", error);
              this.error = true;
              this.notificationService.error('Emprunt non trouvé');
              return of(null);
            })
          );
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((borrowing) => {
        this.borrowing = borrowing;
      });
  }

  renewBorrowing(): void {
    if (!this.borrowing) return;

    this.loading = true;
    this.borrowingService
      .renewBorrowing(this.borrowing.id)
      .pipe(
        catchError((error) => {
          console.error("Erreur lors du renouvellement de l'emprunt:", error);
          this.notificationService.error(
            'Impossible de renouveler cet emprunt'
          );
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((result) => {
        if (result) {
          this.borrowing = result;
          this.notificationService.success('Emprunt renouvelé avec succès');
        }
      });
  }

  returnBorrowing(): void {
    if (!this.borrowing) return;

    this.loading = true;
    this.borrowingService
      .returnBorrowing(this.borrowing.id)
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
          this.borrowing = result;
          this.notificationService.success('Livre retourné avec succès');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/borrowings']);
  }

  getDaysRemaining(): number {
    if (!this.borrowing) return 0;
    return this.borrowingService.getDaysRemaining(this.borrowing.dueDate);
  }

  formatDueDate(): { text: string; isOverdue: boolean } {
    if (!this.borrowing) return { text: '', isOverdue: false };
    return this.borrowingService.formatDueDate(this.borrowing.dueDate);
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
