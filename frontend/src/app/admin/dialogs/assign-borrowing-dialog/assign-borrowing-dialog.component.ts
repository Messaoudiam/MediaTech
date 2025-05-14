import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { CopyService } from '../../../core/services/copy.service';
import { BorrowingService } from '../../../core/services/borrowing.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// Interface adaptée au format retourné par le service
interface Copy {
  id: string;
  resourceId: string;
  available: boolean;
  condition: string;
  resource?: {
    id: string;
    title: string;
    author: string;
  };
  inventoryNumber?: string;
}

@Component({
  selector: 'app-assign-borrowing-dialog',
  templateUrl: './assign-borrowing-dialog.component.html',
  styleUrls: ['./assign-borrowing-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
  ],
  providers: [provideNativeDateAdapter()],
})
export class AssignBorrowingDialogComponent implements OnInit {
  assignForm: FormGroup;
  users: User[] = [];
  availableCopies: Copy[] = [];
  loading = false;
  submitting = false;
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssignBorrowingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private copyService: CopyService,
    private borrowingService: BorrowingService,
    private snackBar: MatSnackBar
  ) {
    this.assignForm = this.fb.group({
      userId: ['', Validators.required],
      copyId: ['', Validators.required],
      dueDate: [''],
      comments: ['Attribution par administrateur'],
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    // Récupérer directement les copies disponibles pour le débogage
    this.debugGetAvailableCopies();
  }

  // Méthode de débogage pour récupérer directement les copies disponibles
  debugGetAvailableCopies(): void {
    console.log('DEBUG: Récupération directe des copies disponibles');
    const url = `${environment.apiUrl}/copies?available=true`;

    this.http.get<any[]>(url, { withCredentials: true }).subscribe(
      (copies) => {
        console.log('DEBUG: Copies disponibles reçues directement:', copies);
        console.log('DEBUG: Nombre de copies disponibles:', copies.length);
        copies.forEach((copy, index) => {
          console.log(`DEBUG: Copie #${index + 1}:`, copy);
        });
      },
      (error) => {
        console.error(
          'DEBUG: Erreur lors de la récupération directe des copies:',
          error
        );
      }
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl, { withCredentials: true });
  }

  loadInitialData(): void {
    this.loading = true;
    console.log('Démarrage du chargement des données...');

    // Récupérer les utilisateurs et les copies séparément pour mieux isoler les problèmes
    this.getUsers().subscribe(
      (users) => {
        console.log(`Utilisateurs récupérés: ${users.length}`);
        this.users = users;

        // Maintenant, récupérer les copies disponibles
        this.copyService.getAvailableCopiesWithResources().subscribe(
          (copies) => {
            console.log(`Copies disponibles récupérées: ${copies.length}`);
            console.log(
              'Toutes les copies disponibles:',
              JSON.stringify(copies)
            );
            this.availableCopies = copies;

            // Vérifier les propriétés de chaque copie
            copies.forEach((copy, index) => {
              console.log(
                `Copie #${index + 1} - ID: ${copy.id}, resourceId: ${
                  copy.resourceId
                }`
              );
              console.log(`Copie #${index + 1} - Resource:`, copy.resource);
            });

            this.loading = false;
          },
          (error) => {
            console.error('Erreur lors de la récupération des copies:', error);
            this.snackBar.open(
              'Erreur lors du chargement des copies',
              'Fermer',
              { duration: 3000 }
            );
            this.availableCopies = [];
            this.loading = false;
          }
        );
      },
      (error) => {
        console.error(
          'Erreur lors de la récupération des utilisateurs:',
          error
        );
        this.snackBar.open(
          'Erreur lors du chargement des utilisateurs',
          'Fermer',
          { duration: 3000 }
        );
        this.users = [];
        this.loading = false;
      }
    );
  }

  onSubmit(): void {
    if (this.assignForm.valid) {
      this.submitting = true;
      const formValue = this.assignForm.value;

      this.borrowingService
        .createBorrowingByAdmin(formValue)
        .pipe(
          tap(() => {
            this.snackBar.open('Emprunt attribué avec succès', 'Fermer', {
              duration: 3000,
            });
            this.dialogRef.close(true);
          }),
          catchError((error) => {
            this.snackBar.open(
              error.error?.message ||
                "Erreur lors de l'attribution de l'emprunt",
              'Fermer',
              { duration: 5000 }
            );
            return of(null);
          }),
          finalize(() => (this.submitting = false))
        )
        .subscribe();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getUserDisplayName(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName} (${user.email})`;
    }
    return user.email;
  }

  getCopyDisplayName(copy: Copy): string {
    return `${copy.resource?.title || 'Titre inconnu'} - ${
      copy.resource?.author || 'Auteur inconnu'
    } (N°${copy.inventoryNumber || copy.id})`;
  }
}
