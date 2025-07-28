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
import { catchError, finalize, tap, map } from 'rxjs/operators';

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
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule
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

    this.http
      .get<Copy[]>(url, {
        withCredentials: true,
      })
      .subscribe(
        (copies: Copy[]) => {
          console.log('DEBUG: Copies disponibles reçues directement:', copies);
          console.log('DEBUG: Nombre de copies disponibles:', copies.length);
          copies.forEach((copy: Copy, index: number) => {
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
        this.loadAvailableCopies();
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

  loadAvailableCopies(): void {
    console.log('Chargement des exemplaires disponibles...');
    this.loading = true;

    // S'assurer que le paramètre available=true est correctement passé
    const url = `${environment.apiUrl}/copies?available=true`;
    console.log('URL appelée:', url);

    // Test direct avec une requête fetch native pour vérifier les données brutes
    fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })
      .then((response) => response.json())
      .then((rawData) => {
        console.log('Données brutes reçues via fetch:', rawData);
      })
      .catch((error) => {
        console.error('Erreur fetch:', error);
      });

    // Procéder avec la requête HTTP normale
    this.http
      .get<Copy[]>(url, { withCredentials: true })
      .pipe(
        tap((copies) => {
          console.log(
            `${copies.length} exemplaires disponibles récupérés:`,
            copies
          );

          // Si aucun exemplaire n'est trouvé, essayons sans le filtre
          if (copies.length === 0) {
            console.warn(
              'Aucun exemplaire disponible trouvé. Essayons de récupérer tous les exemplaires.'
            );
            this.loadAllCopiesAndFilterAvailable();
            return;
          }

          if (copies.length > 0) {
            // Vérifier si les exemplaires ont leurs ressources associées
            const hasResources = copies.some((copy) => copy.resource);
            console.log(
              'Les exemplaires ont-ils leurs ressources associées?',
              hasResources
            );

            if (!hasResources) {
              console.log(
                'Récupération des ressources en une seule requête pour enrichir les exemplaires'
              );
              this.enrichCopiesWithResources(copies);
              return;
            }
          }

          this.availableCopies = copies;
          console.log('Exemplaires disponibles chargés:', this.availableCopies);
        }),
        catchError((error) => {
          console.error(
            'Erreur lors du chargement des exemplaires disponibles:',
            error
          );
          this.snackBar.open(
            'Erreur lors du chargement des exemplaires disponibles',
            'Fermer',
            { duration: 5000 }
          );
          return of([]);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe();
  }

  // Méthode de secours pour récupérer tous les exemplaires et filtrer côté client
  private loadAllCopiesAndFilterAvailable(): void {
    console.log(
      'Récupération de tous les exemplaires et filtrage côté client...'
    );

    this.http
      .get<Copy[]>(`${environment.apiUrl}/copies`, { withCredentials: true })
      .pipe(
        catchError((error) => {
          console.error(
            'Erreur lors de la récupération de tous les exemplaires:',
            error
          );
          return of([]);
        })
      )
      .subscribe((allCopies) => {

        // Filtrer manuellement les exemplaires disponibles
        const availableCopies = allCopies.filter(
          (copy) => copy.available === true
        );

        console.log(
          `${availableCopies.length} exemplaires disponibles après filtrage`
        );

        if (availableCopies.length > 0) {
          // Vérifier si enrichissement nécessaire
          if (!availableCopies[0].resource) {
            this.enrichCopiesWithResources(availableCopies);
          } else {
            this.availableCopies = availableCopies;
          }
        } else {
          this.availableCopies = [];
        }
      });
  }

  // Méthode optimisée pour enrichir les exemplaires avec les ressources
  private enrichCopiesWithResources(copies: Copy[]): void {
    if (copies.length === 0) {
      this.availableCopies = [];
      return;
    }

    // Récupérer toutes les ressources en une seule requête pour de meilleures performances
    this.http
      .get<any[]>(`${environment.apiUrl}/resources`, { withCredentials: true })
      .pipe(
        catchError((error) => {
          console.error(
            'Erreur lors de la récupération des ressources:',
            error
          );
          return of([]);
        })
      )
      .subscribe((resources) => {
        if (!resources || resources.length === 0) {
          console.warn('Aucune ressource récupérée');
          this.availableCopies = copies;
          return;
        }

        console.log(`${resources.length} ressources récupérées`);

        // Créer un dictionnaire des ressources par ID pour un accès rapide
        const resourceMap = resources.reduce((map, resource) => {
          map[resource.id] = resource;
          return map;
        }, {});

        // Enrichir chaque exemplaire avec sa ressource
        this.availableCopies = copies.map((copy) => {
          if (resourceMap[copy.resourceId]) {
            return {
              ...copy,
              resource: resourceMap[copy.resourceId],
            };
          }
          return {
            ...copy,
            resource: {
              id: copy.resourceId,
              title: 'Titre inconnu',
              author: 'Auteur inconnu',
            },
          };
        });

        console.log('Exemplaires enrichis avec succès:', this.availableCopies);
      });
  }

  onSubmit(): void {
    if (this.assignForm.valid) {
      this.submitting = true;
      const formValue = { ...this.assignForm.value };

      // Si la date est vide ou null, supprimer le champ dueDate pour que le backend utilise la date par défaut
      if (!formValue.dueDate) {
        delete formValue.dueDate;
      }

      this.borrowingService
        .createBorrowingByAdmin(formValue)
        .pipe(
          tap((response) => {
            console.log('Emprunt créé avec succès:', response);

            // Marquer l'exemplaire comme non disponible localement
            const copyIndex = this.availableCopies.findIndex(
              (copy) => copy.id === formValue.copyId
            );

            if (copyIndex !== -1) {
              this.availableCopies.splice(copyIndex, 1);
            }

            this.snackBar.open('Emprunt attribué avec succès', 'Fermer', {
              duration: 3000,
            });
            this.dialogRef.close(true);
          }),
          catchError((error) => {
            console.error("Erreur lors de l'attribution de l'emprunt:", error);
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
