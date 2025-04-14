import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  errorMessage = '';
  loading = false;
  accountLocked = false;
  loginAttempts = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    console.log('Initialisation du composant LoginComponent');
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    console.log('Tentative de connexion');

    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.accountLocked = false;

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };

      console.log('Credentials utilisées pour la connexion:', credentials);

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Connexion réussie avec réponse:', response);
          this.loginAttempts = 0;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur lors de la connexion:', error);
          console.error('Statut:', error.status);
          console.error("Message d'erreur:", error.error);
          this.loading = false;
          this.loginAttempts++;

          if (error.status === 401) {
            if (error.error?.message) {
              this.errorMessage = error.error.message;

              if (
                error.error.message.includes('verrouillé') ||
                error.error.message.includes('temporairement')
              ) {
                this.accountLocked = true;
              }
            } else {
              this.errorMessage = 'Email ou mot de passe incorrect';
            }
          } else if (error.status === 0) {
            this.errorMessage =
              'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
          } else {
            this.errorMessage =
              error?.error?.message ||
              'Erreur de connexion. Veuillez réessayer.';
          }

          console.log("Message d'erreur affiché:", this.errorMessage);
          console.log('Nombre de tentatives:', this.loginAttempts);
        },
        complete: () => {
          console.log('Observable de connexion complété');
          this.loading = false;
        },
      });
    } else {
      console.log('Formulaire invalide');
      this.loginForm.markAllAsTouched();
    }
  }

  resetAccountLock(): void {
    const email = this.loginForm.get('email')?.value;

    if (!email) {
      this.snackBar.open('Veuillez entrer votre adresse email', 'Fermer', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }

    this.loading = true;
    this.authService.resetAccountLock(email).subscribe({
      next: (response) => {
        console.log('Réinitialisation réussie:', response);
        this.accountLocked = false;
        this.errorMessage = '';
        this.snackBar.open(
          'Votre compte a été déverrouillé. Vous pouvez maintenant vous connecter.',
          'Fermer',
          {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          }
        );
      },
      error: (error) => {
        console.error('Erreur lors de la réinitialisation:', error);
        this.snackBar.open(
          'Impossible de réinitialiser votre compte. Veuillez réessayer plus tard.',
          'Fermer',
          {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          }
        );
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);

    if (!control) return '';

    if (control.hasError('required')) {
      return 'Ce champ est obligatoire';
    }

    if (controlName === 'email' && control.hasError('email')) {
      return 'Veuillez entrer une adresse email valide';
    }

    return '';
  }
}
