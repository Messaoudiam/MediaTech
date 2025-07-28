import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

interface Resource {
  id: string;
  title: string;
  type: string;
  author?: string;
}

interface Copy {
  id: string;
  resourceId: string;
  available: boolean;
  condition: string;
  createdAt: string;
  updatedAt: string;
  resource?: Resource;
}

@Component({
  selector: 'app-copy-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="copy-management-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title
            >Ajouter des exemplaires aux ressources</mat-card-title
            >
            <mat-card-subtitle
              >Créez de nouveaux exemplaires pour les livres
              disponibles</mat-card-subtitle
              >
            </mat-card-header>
    
            <mat-card-content>
              <div class="form-section">
                <h3>Nouveau exemplaire</h3>
    
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Ressource</mat-label>
                    <mat-select [(ngModel)]="selectedResourceId">
                      @for (resource of resources; track resource) {
                        <mat-option
                          [value]="resource.id"
                          >
                          {{ resource.title }} ({{
                          resource.author || 'Auteur inconnu'
                          }})
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
    
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>État</mat-label>
                    <mat-select [(ngModel)]="newCopy.condition">
                      <mat-option value="Neuf">Neuf</mat-option>
                      <mat-option value="Bon état">Bon état</mat-option>
                      <mat-option value="État moyen">État moyen</mat-option>
                      <mat-option value="Usé">Usé</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
    
                <div class="form-actions">
                  <button
                    mat-raised-button
                    color="primary"
                    (click)="addCopy()"
                    [disabled]="!selectedResourceId || loading"
                    >
                    <mat-icon>add</mat-icon>
                    Ajouter l'exemplaire
                  </button>
                </div>
              </div>
    
              @if (loading) {
                <div class="loading-container">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              }
    
              @if (!loading && copies.length > 0) {
                <div class="copies-list">
                  <h3>Exemplaires existants</h3>
                  <table mat-table [dataSource]="copies" class="copies-table">
                    <ng-container matColumnDef="resource">
                      <th mat-header-cell *matHeaderCellDef>Ressource</th>
                      <td mat-cell *matCellDef="let copy">
                        {{ copy.resource?.title || 'N/A' }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="condition">
                      <th mat-header-cell *matHeaderCellDef>État</th>
                      <td mat-cell *matCellDef="let copy">{{ copy.condition }}</td>
                    </ng-container>
                    <ng-container matColumnDef="available">
                      <th mat-header-cell *matHeaderCellDef>Disponibilité</th>
                      <td mat-cell *matCellDef="let copy">
                        <span
                          [ngClass]="copy.available ? 'available' : 'unavailable'"
                          >
                          {{ copy.available ? 'Disponible' : 'Emprunté' }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let copy">
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="deleteCopy(copy.id)"
                          [disabled]="!copy.available"
                          >
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
                  </table>
                </div>
              }
    
              @if (!loading && copies.length === 0) {
                <div class="no-copies">
                  <p>Aucun exemplaire trouvé.</p>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
    `,
  styles: [
    `
      .copy-management-container {
        padding: 20px;
      }

      .form-section {
        margin-bottom: 30px;
      }

      .form-row {
        width: 100%;
        margin-bottom: 15px;
      }

      mat-form-field {
        width: 100%;
      }

      .form-actions {
        margin-top: 20px;
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
        padding: 20px;
        color: #666;
      }
    `,
  ],
})
export class CopyManagementComponent implements OnInit {
  resources: Resource[] = [];
  copies: Copy[] = [];
  selectedResourceId: string = '';
  loading: boolean = false;
  displayedColumns: string[] = [
    'resource',
    'condition',
    'available',
    'actions',
  ];

  newCopy = {
    condition: 'Neuf',
  };

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadResources();
    this.loadCopies();
  }

  loadResources(): void {
    this.loading = true;
    this.http
      .get<Resource[]>(`${environment.apiUrl}/resources`)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des ressources', error);
          this.snackBar.open('Impossible de charger les ressources', 'Fermer', {
            duration: 3000,
          });
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((resources) => {
        this.resources = resources;
      });
  }

  loadCopies(): void {
    this.loading = true;
    console.log('Démarrage du chargement des exemplaires...');

    // Ne pas spécifier de filtre sur available pour récupérer tous les exemplaires
    this.http
      .get<Copy[]>(`${environment.apiUrl}/copies`)
      .pipe(
        tap((copies) => {
          console.log("Réponse brute de l'API:", copies);
          console.log("Nombre d'exemplaires reçus:", copies.length);

          // Si aucun exemplaire n'est trouvé, faisons un appel direct à la base de données
          if (copies.length === 0) {
            console.warn(
              'Aucun exemplaire trouvé, vérification directe dans la base de données nécessaire.'
            );
          } else if (copies.length > 0) {
            // Vérifier si les exemplaires ont leurs ressources associées
            const hasResources = copies.some((copy) => copy.resource);
            console.log(
              'Les exemplaires ont-ils leurs ressources associées?',
              hasResources
            );

            if (!hasResources) {
              console.log(
                'Récupération séparée des informations des ressources nécessaire'
              );
              this.processAndEnrichCopies(copies);
              return;
            }
          }

          this.copies = copies;
          console.log('Exemplaires chargés dans le composant:', this.copies);
        }),
        catchError((error) => {
          console.error('Erreur lors du chargement des exemplaires', error);
          this.snackBar.open(
            'Impossible de charger les exemplaires',
            'Fermer',
            {
              duration: 3000,
            }
          );
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe();
  }

  // Méthode pour enrichir les exemplaires avec les informations des ressources
  private processAndEnrichCopies(copies: Copy[]): void {
    console.log('Enrichissement des exemplaires avec leurs ressources');

    // Récupérer tous les IDs de ressources uniques
    const resourceIds = [...new Set(copies.map((copy) => copy.resourceId))];
    console.log('IDs de ressources à récupérer:', resourceIds);

    if (resourceIds.length === 0) {
      this.copies = copies;
      return;
    }

    // Récupérer toutes les ressources en une seule requête
    this.http
      .get<Resource[]>(`${environment.apiUrl}/resources`)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la récupération des ressources', error);
          return of([]);
        })
      )
      .subscribe((resources) => {
        console.log('Ressources récupérées:', resources);

        // Créer un mapping des ressources par ID pour un accès rapide
        const resourceMap = resources.reduce((map, resource) => {
          map[resource.id] = resource;
          return map;
        }, {} as Record<string, Resource>);

        // Enrichir chaque exemplaire avec sa ressource
        this.copies = copies.map((copy) => {
          const resource = resourceMap[copy.resourceId];
          return {
            ...copy,
            resource: resource || {
              id: copy.resourceId,
              title: 'Titre inconnu',
              type: 'Type inconnu',
              author: 'Auteur inconnu',
            },
          };
        });

        console.log('Exemplaires enrichis:', this.copies);
      });
  }

  addCopy(): void {
    if (!this.selectedResourceId) {
      this.snackBar.open('Veuillez sélectionner une ressource', 'Fermer', {
        duration: 3000,
      });
      return;
    }

    this.loading = true;

    const payload = {
      resourceId: this.selectedResourceId,
      condition: this.newCopy.condition,
      available: true,
    };

    this.http
      .post<Copy>(`${environment.apiUrl}/copies`, payload)
      .pipe(
        catchError((error) => {
          console.error("Erreur lors de l'ajout d'un exemplaire", error);
          this.snackBar.open("Impossible d'ajouter l'exemplaire", 'Fermer', {
            duration: 3000,
          });
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((response) => {
        if (response) {
          this.snackBar.open('Exemplaire ajouté avec succès', 'Fermer', {
            duration: 3000,
          });
          this.loadCopies();
          // Réinitialiser le formulaire
          this.newCopy.condition = 'Neuf';
        }
      });
  }

  deleteCopy(copyId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet exemplaire ?')) {
      return;
    }

    this.loading = true;

    this.http
      .delete(`${environment.apiUrl}/copies/${copyId}`)
      .pipe(
        catchError((error) => {
          console.error("Erreur lors de la suppression d'un exemplaire", error);
          this.snackBar.open("Impossible de supprimer l'exemplaire", 'Fermer', {
            duration: 3000,
          });
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((response) => {
        this.snackBar.open('Exemplaire supprimé avec succès', 'Fermer', {
          duration: 3000,
        });
        this.loadCopies();
      });
  }
}
