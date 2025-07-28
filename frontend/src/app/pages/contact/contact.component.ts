import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ContactService, ContactRequest } from '../../services/contact.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule
],
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;

  // Utiliser le pattern d'injection moderne d'Angular
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  constructor() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      message: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(2000),
        ],
      ],
    });
  }

  ngOnInit(): void {
    // Récupérer les informations de l'utilisateur connecté
    this.authService.currentUser$.subscribe((user) => {
      if (user && user.email) {
        // Pré-remplir l'email si l'utilisateur est connecté
        this.contactForm.get('email')?.setValue(user.email);
      }
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const contactData: ContactRequest = this.contactForm.value;

    this.contactService.submitContactRequest(contactData).subscribe({
      next: () => {
        // Réinitialiser le formulaire avant d'afficher le message pour éviter les états rouges
        this.resetForm();

        this.snackBar.open(
          'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
          'Fermer',
          { duration: 5000, panelClass: 'success-snackbar' }
        );
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error("Erreur lors de l'envoi du message", error);
        this.snackBar.open(
          "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer ultérieurement.",
          'Fermer',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
        this.isSubmitting = false;
      },
    });
  }

  private resetForm(): void {
    // Sauvegarder l'email actuel s'il y a un utilisateur connecté
    const currentEmail = this.authService.currentUser?.email || '';

    this.contactForm.reset();

    // Réinitialiser l'état des contrôles du formulaire
    Object.keys(this.contactForm.controls).forEach((key) => {
      const control = this.contactForm.get(key);
      control?.setErrors(null);
    });

    // Restaurer l'email pour les utilisateurs connectés
    if (currentEmail) {
      this.contactForm.get('email')?.setValue(currentEmail);
    }
  }
}
