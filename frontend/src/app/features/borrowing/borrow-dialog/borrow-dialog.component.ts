import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BorrowingService } from '../../../core/services/borrowing.service';
import { NotificationService } from '../../../core/services/notification.service';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

export interface BorrowDialogData {
  resourceId: string;
  resourceTitle: string;
  copies: any[];
}

@Component({
  selector: 'app-borrow-dialog',
  templateUrl: './borrow-dialog.component.html',
  styleUrls: ['./borrow-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class BorrowDialogComponent implements OnInit {
  loading = false;
  selectedCopyId: string | null = null;

  constructor(
    private borrowingService: BorrowingService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<BorrowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BorrowDialogData
  ) {}

  ngOnInit(): void {
    // Afficher les copies disponibles pour débugger
    console.log('Copies disponibles:', this.data.copies);

    if (this.data.copies && this.data.copies.length > 0) {
      console.log(
        'Format des ID des copies:',
        this.data.copies.map((copy) => typeof copy.id)
      );
    } else {
      console.warn('Aucun exemplaire disponible pour cette ressource');
    }

    // Sélectionner automatiquement le premier exemplaire disponible
    const firstAvailableCopy = this.data.copies.find((copy) => copy.available);
    if (firstAvailableCopy) {
      this.selectedCopyId = firstAvailableCopy.id;
      console.log(
        'Exemplaire sélectionné automatiquement:',
        this.selectedCopyId
      );
    } else {
      console.warn('Aucun exemplaire disponible trouvé');
    }
  }

  getAvailableCopies(): any[] {
    return this.data.copies.filter((copy) => copy.available);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.selectedCopyId) {
      this.notificationService.error('Veuillez sélectionner un exemplaire');
      return;
    }

    console.log(
      "Tentative de création d'emprunt avec l'exemplaire ID:",
      this.selectedCopyId
    );
    console.log("Type de l'ID:", typeof this.selectedCopyId);

    // S'assurer que l'ID est bien une chaîne de caractères
    const copyId = String(this.selectedCopyId).trim();

    this.loading = true;
    this.borrowingService
      .createBorrowing(copyId)
      .pipe(
        tap((response) => {
          console.log("Réponse du service d'emprunt:", response);
        }),
        catchError((error) => {
          console.error("Erreur lors de la création de l'emprunt:", error);
          console.log("Détails de l'erreur:", {
            status: error.status,
            message: error.message,
            error: error.error,
          });

          let errorMessage = "Impossible de créer l'emprunt";

          if (error.status === 403) {
            errorMessage =
              "Vous avez atteint le nombre maximum d'emprunts actifs";
          } else if (error.status === 400) {
            errorMessage = "Cet exemplaire n'est plus disponible";
            // Afficher plus de détails sur l'erreur 400
            if (error.error && error.error.message) {
              console.log("Message d'erreur du serveur:", error.error.message);
              errorMessage = error.error.message;
            }
          }

          this.notificationService.error(errorMessage);
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((result) => {
        if (result) {
          this.notificationService.success(
            `Vous avez emprunté "${this.data.resourceTitle}"`
          );
          this.dialogRef.close(true);
        }
      });
  }
}
