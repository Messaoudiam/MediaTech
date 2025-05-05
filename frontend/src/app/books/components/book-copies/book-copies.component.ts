import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CopyService, Copy } from '../../../core/services/copy.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-book-copies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Exemplaires de "{{ bookTitle }}"</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="add-copy-form" *ngIf="isAdmin">
          <mat-form-field appearance="outline">
            <mat-label>État de l'exemplaire</mat-label>
            <mat-select [(ngModel)]="newCopyCondition">
              <mat-option value="Neuf">Neuf</mat-option>
              <mat-option value="Bon état">Bon état</mat-option>
              <mat-option value="État moyen">État moyen</mat-option>
              <mat-option value="Usé">Usé</mat-option>
            </mat-select>
          </mat-form-field>
          <button
            mat-raised-button
            color="primary"
            (click)="addCopy()"
            [disabled]="loading"
          >
            <mat-icon>add</mat-icon>
            Ajouter un exemplaire
          </button>
        </div>

        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <table
          mat-table
          [dataSource]="copies"
          class="copies-table"
          *ngIf="!loading && copies.length > 0"
        >
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let copy">
              {{ copy.id.substring(0, 8) }}...
            </td>
          </ng-container>

          <ng-container matColumnDef="condition">
            <th mat-header-cell *matHeaderCellDef>État</th>
            <td mat-cell *matCellDef="let copy">{{ copy.condition }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let copy">
              <span [ngClass]="copy.available ? 'available' : 'unavailable'">
                {{ copy.available ? 'Disponible' : 'Emprunté' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions" *ngIf="isAdmin">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let copy">
              <button
                mat-icon-button
                color="warn"
                (click)="deleteCopy(copy.id)"
                [disabled]="!copy.available"
                title="Supprimer"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>

        <div *ngIf="!loading && copies.length === 0" class="no-copies">
          <p>Aucun exemplaire disponible pour ce livre.</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .add-copy-form {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        align-items: center;
      }

      mat-form-field {
        flex: 1;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        margin: 20px 0;
      }

      .copies-table {
        width: 100%;
      }

      .available {
        color: green;
        font-weight: 500;
      }

      .unavailable {
        color: red;
        font-weight: 500;
      }

      .no-copies {
        text-align: center;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 4px;
      }

      @media (max-width: 600px) {
        .add-copy-form {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class BookCopiesComponent implements OnInit {
  @Input() bookId!: string;
  @Input() bookTitle: string = '';
  @Input() bookCopies?: Copy[] = [];

  copies: Copy[] = [];
  newCopyCondition: string = 'Neuf';
  loading: boolean = false;
  displayedColumns: string[] = ['id', 'condition', 'status'];
  isAdmin: boolean = false;

  constructor(
    private copyService: CopyService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('BookCopiesComponent initialisé avec bookId:', this.bookId);
    console.log('Exemplaires passés au composant:', this.bookCopies);
    this.checkAuthStatus();
    this.loadCopies();
  }

  private checkAuthStatus(): void {
    this.authService.isAuthenticated().subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.authService.getUserProfile().subscribe((user) => {
          this.isAdmin = user?.role === 'ADMIN';

          // Ajouter la colonne d'actions pour les administrateurs
          if (this.isAdmin && !this.displayedColumns.includes('actions')) {
            this.displayedColumns.push('actions');
          }
        });
      }
    });
  }

  loadCopies(): void {
    if (!this.bookId) {
      console.error('Impossible de charger les exemplaires: bookId manquant');
      return;
    }

    // Si nous avons déjà des exemplaires passés via @Input, les utiliser
    if (this.bookCopies && this.bookCopies.length > 0) {
      console.log(
        'Utilisation des exemplaires passés au composant:',
        this.bookCopies
      );
      this.copies = this.bookCopies;
      return;
    }

    this.loading = true;
    console.log(`Chargement des exemplaires pour le livre ${this.bookId}...`);

    this.copyService
      .getCopiesByResourceId(this.bookId)
      .pipe(
        catchError((error) => {
          console.error(
            'Erreur lors de la récupération des exemplaires:',
            error
          );

          // Affichage des détails de l'erreur pour le débogage
          if (error.status) {
            console.error(`Status: ${error.status}, URL: ${error.url}`);
            console.error('Message:', error.error?.message || 'Aucun message');
            console.error('Détails:', JSON.stringify(error.error, null, 2));
          }

          this.snackBar.open(
            `Impossible de charger les exemplaires: ${
              error.status === 404
                ? 'Endpoint non trouvé'
                : error.message || 'Erreur inconnue'
            }`,
            'Fermer',
            {
              duration: 5000,
            }
          );
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
          console.log('Chargement terminé');
        })
      )
      .subscribe((copies) => {
        this.copies = copies || [];
        console.log(
          `${this.copies.length} exemplaires chargés pour le livre ${this.bookId}`,
          this.copies
        );

        // Si aucun exemplaire n'est récupéré mais que nous savons qu'il en existe
        if (this.copies.length === 0) {
          console.warn('Aucun exemplaire récupéré, possible problème API');
        }
      });
  }

  addCopy(): void {
    console.log(
      "Tentative d'ajout d'un exemplaire avec le titre:",
      this.bookTitle
    );
    console.log(
      "État d'authentification:",
      this.http
        .get(`${environment.apiUrl}/auth/check-auth`, { withCredentials: true })
        .subscribe(
          (result) => console.log('Authentifié:', result),
          (err) =>
            console.error("Erreur d'authentification:", err.status, err.error)
        )
    );

    if (!this.bookId) {
      console.error("Impossible d'ajouter un exemplaire: bookId manquant");
      this.snackBar.open('Erreur: ID du livre manquant', 'Fermer', {
        duration: 3000,
      });
      return;
    }

    this.loading = true;
    console.log(
      `Ajout d'un exemplaire pour le livre ${this.bookId} avec l'état: ${this.newCopyCondition}`
    );

    this.copyService
      .addCopy(this.bookId, this.newCopyCondition)
      .pipe(
        catchError((error) => {
          console.error(
            "Erreur détaillée lors de l'ajout d'un exemplaire:",
            error
          );

          // Message d'erreur plus détaillé
          let errorMessage = "Impossible d'ajouter l'exemplaire";
          if (error.status === 401) {
            errorMessage +=
              ". Vous n'êtes pas autorisé. Veuillez vous reconnecter.";
          } else if (error.status === 400) {
            errorMessage += '. Données invalides.';
          } else if (error.status === 500) {
            errorMessage += '. Erreur serveur.';
          }

          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000,
          });
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          console.log("Opération d'ajout terminée");
        })
      )
      .subscribe((response) => {
        if (response) {
          console.log('Exemplaire ajouté avec succès:', response);
          this.snackBar.open('Exemplaire ajouté avec succès', 'Fermer', {
            duration: 3000,
          });
          this.loadCopies();
          this.newCopyCondition = 'Neuf';
        } else {
          console.log("Échec de l'ajout d'exemplaire - réponse nulle");
        }
      });
  }

  deleteCopy(copyId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exemplaire ?')) {
      return;
    }

    this.loading = true;
    console.log(`Suppression de l'exemplaire ${copyId}...`);

    this.copyService
      .deleteCopy(copyId)
      .pipe(
        catchError((error) => {
          console.error(
            "Erreur détaillée lors de la suppression d'un exemplaire:",
            error
          );

          // Message d'erreur plus détaillé
          let errorMessage = "Impossible de supprimer l'exemplaire";
          if (error.status === 401) {
            errorMessage += ". Vous n'êtes pas autorisé.";
          } else if (error.status === 404) {
            errorMessage += '. Exemplaire non trouvé.';
          }

          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 3000,
          });
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
          console.log('Opération de suppression terminée');
        })
      )
      .subscribe((response) => {
        if (response !== null) {
          console.log('Exemplaire supprimé avec succès');
          this.snackBar.open('Exemplaire supprimé avec succès', 'Fermer', {
            duration: 3000,
          });
          this.loadCopies();
        } else {
          console.log("Échec de la suppression d'exemplaire");
        }
      });
  }
}
