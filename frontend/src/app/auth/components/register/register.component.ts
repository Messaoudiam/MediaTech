import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(8), this.passwordValidator],
      ],
      confirmPassword: ['', [Validators.required]],
    });

    // Ajouter le validateur de correspondance des mots de passe
    this.registerForm.addValidators(this.checkPasswords);
  }

  // Validation personnalisée pour le mot de passe
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;

    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );
    const hasMinLength = password.length >= 8;

    if (
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumeric ||
      !hasSpecialChar ||
      !hasMinLength
    ) {
      return {
        passwordInvalid: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric,
          hasSpecialChar,
          hasMinLength,
        },
      };
    }

    return null;
  }

  // Validation personnalisée pour vérifier que les mots de passe correspondent
  checkPasswords(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password === confirmPassword) {
      return null;
    } else {
      return { notSame: true };
    }
  }

  onSubmit(): void {

    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      // Ajout d'une validation de sécurité sur les mots de passe
      if (
        this.registerForm.value.password !==
        this.registerForm.value.confirmPassword
      ) {
        this.errorMessage = 'Les mots de passe ne correspondent pas';
        this.notificationService.error(
          'Les mots de passe ne correspondent pas'
        );
        this.loading = false;
        return;
      }

      // Validation supplémentaire pour s'assurer que le mot de passe est conforme
      const password = this.registerForm.value.password;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumeric = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        password
      );
      const hasMinLength = password.length >= 8;

      if (
        !hasUpperCase ||
        !hasLowerCase ||
        !hasNumeric ||
        !hasSpecialChar ||
        !hasMinLength
      ) {
        this.errorMessage =
          'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial';
        this.notificationService.error(
          'Le mot de passe ne respecte pas les critères de sécurité'
        );
        this.loading = false;
        return;
      }

      // Utiliser directement les valeurs complètes du formulaire
      const registerData = this.registerForm.value;


      this.authService.register(registerData).subscribe({
        next: (response) => {
          // En cas de succès, on pourrait afficher un message de succès
          this.loading = false;
          this.notificationService.success(
            'Inscription réussie ! Vous allez être redirigé vers la page de connexion.'
          );
          // La redirection est gérée par le service d'authentification
        },
        error: (error) => {
          console.error("Erreur lors de l'inscription:", error);
          this.loading = false;

          // Extraction améliorée des messages d'erreur
          if (
            error.error &&
            typeof error.error === 'object' &&
            error.error.message
          ) {
            this.errorMessage = error.error.message;
            this.notificationService.error(error.error.message);
          } else if (typeof error.error === 'string') {
            try {
              const parsedError = JSON.parse(error.error);
              this.errorMessage =
                parsedError.message || "Erreur lors de l'inscription";
              this.notificationService.error(this.errorMessage);
            } catch (e) {
              this.errorMessage = error.error;
              this.notificationService.error(error.error);
            }
          } else if (error.status === 400) {
            this.errorMessage =
              'Données invalides. Vérifiez que le mot de passe respecte les critères de sécurité.';
            this.notificationService.error('Données invalides');
          } else if (error.status === 409) {
            this.errorMessage = 'Cet email est déjà utilisé.';
            this.notificationService.error('Cet email est déjà utilisé');
          } else if (error.status === 0) {
            this.errorMessage =
              'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
            this.notificationService.error('Connexion au serveur impossible');
          } else {
            this.errorMessage =
              "Erreur lors de l'inscription. Veuillez réessayer.";
            this.notificationService.error("Erreur lors de l'inscription");
          }

        },
      });
    } else {
      this.registerForm.markAllAsTouched();
      this.notificationService.warning(
        'Veuillez remplir correctement tous les champs'
      );
    }
  }

  getErrorMessage(field: string): string {
    if (this.registerForm.get(field)?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (
      field === 'email' &&
      this.registerForm.get('email')?.hasError('email')
    ) {
      return 'Email invalide';
    }
    if (field === 'password') {
      if (this.registerForm.get('password')?.hasError('minlength')) {
        return 'Le mot de passe doit contenir au moins 8 caractères';
      }
      if (this.registerForm.get('password')?.hasError('passwordInvalid')) {
        return 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial';
      }
    }
    if (field === 'confirmPassword' && this.registerForm.hasError('notSame')) {
      return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }
}
