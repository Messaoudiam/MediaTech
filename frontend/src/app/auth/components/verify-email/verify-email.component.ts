import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="verify-email-container">
      <mat-card class="verify-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon [ngClass]="getIconClass()">{{ getIcon() }}</mat-icon>
            {{ getTitle() }}
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          @if (isLoading) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Vérification de votre email en cours...</p>
          </div>
          } @else {
          <div class="result-container">
            <p [ngClass]="getMessageClass()">{{ message }}</p>

            <div class="actions">
              @if (isSuccess) {
              <button mat-raised-button color="primary" (click)="goToLogin()">
                Se connecter
              </button>
              } @else {
              <button mat-raised-button color="accent" (click)="goToRegister()">
                Retour à l'inscription
              </button>
              }
            </div>
          </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .verify-email-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 60vh;
        padding: 20px;
      }

      .verify-card {
        max-width: 500px;
        width: 100%;
        text-align: center;
      }

      .loading-container,
      .result-container {
        padding: 20px;
      }

      .actions {
        margin-top: 20px;
      }

      .success-message {
        color: #4caf50;
      }

      .error-message {
        color: #f44336;
      }

      .icon-success {
        color: #4caf50;
      }

      .icon-error {
        color: #f44336;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
    `,
  ],
})
export class VerifyEmailComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.isLoading = false;
      this.isSuccess = false;
      this.message =
        'Token de vérification manquant. Veuillez vérifier le lien reçu par email.';
      return;
    }

    this.verifyEmail(token);
  }

  private verifyEmail(token: string) {
    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.message =
          response.message ||
          'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.';
      },
      error: (error) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.message =
          error.error?.message ||
          'Erreur lors de la vérification. Le lien peut être expiré ou invalide.';
      },
    });
  }

  getTitle(): string {
    if (this.isLoading) return 'Vérification en cours...';
    return this.isSuccess ? 'Email vérifié' : 'Erreur de vérification';
  }

  getIcon(): string {
    if (this.isLoading) return 'hourglass_empty';
    return this.isSuccess ? 'check_circle' : 'error';
  }

  getIconClass(): string {
    if (this.isLoading) return '';
    return this.isSuccess ? 'icon-success' : 'icon-error';
  }

  getMessageClass(): string {
    return this.isSuccess ? 'success-message' : 'error-message';
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
