import { Component, OnInit } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-test-copy',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule
],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Test des exemplaires</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <button mat-raised-button color="primary" (click)="fetchCopies()">
          Récupérer tous les exemplaires
        </button>
    
        @if (loading) {
          <div
            style="display: flex; justify-content: center; margin: 20px 0;"
            >
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        }
    
        @if (copies && copies.length) {
          <div>
            <h3>Exemplaires disponibles ({{ copies.length }})</h3>
            <ul>
              @for (copy of copies; track copy) {
                <li>
                  ID: {{ copy.id }} <br />
                  ResourceID: {{ copy.resourceId }} <br />
                  Disponible: {{ copy.available ? 'Oui' : 'Non' }} <br />
                  État: {{ copy.condition || 'Non spécifié' }}
                </li>
              }
            </ul>
          </div>
        }
    
        @if (error) {
          <div style="color: red; margin: 15px 0;">
            {{ error }}
          </div>
        }
      </mat-card-content>
    </mat-card>
    `,
  styles: [
    `
      mat-card {
        margin: 20px;
      }
      ul {
        list-style-type: none;
        padding: 0;
      }
      li {
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #eee;
        border-radius: 4px;
      }
    `,
  ],
})
export class TestCopyComponent implements OnInit {
  copies: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchCopies();
  }

  fetchCopies(): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<any[]>(`${environment.apiUrl}/copies`)
      .pipe(
        catchError((err) => {
          console.error('Erreur lors de la récupération des exemplaires:', err);
          this.error = `Impossible de récupérer les exemplaires: ${err.message}`;
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((copies) => {
        this.copies = copies;
        console.log('Exemplaires récupérés:', copies);
      });
  }
}
