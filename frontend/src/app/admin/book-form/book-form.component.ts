import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { BookService, ResourceType } from '../../core/services/book.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.scss'],
})
export class BookFormComponent implements OnInit {
  bookForm!: FormGroup;
  loading = false;
  selectedCoverImage: File | null = null;
  imagePreview: string | null = null;

  resourceTypes = Object.values(ResourceType);

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.bookForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      type: [ResourceType.BOOK, Validators.required],
      author: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      isbn: [
        '',
        [
          Validators.pattern(
            /^(?:\d[- ]?){9}[\dXx]$|^\d{13}$|^(?:\d[-]?){12}\d$/
          ),
        ],
      ],
      publisher: [''],
      publishedYear: [
        null,
        [Validators.min(1000), Validators.max(new Date().getFullYear())],
      ],
      description: ['', [Validators.required, Validators.minLength(10)]],
      genre: [''],
      pageCount: [null, [Validators.min(1)]],
      language: ['Français'],
      coverImage: [null],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        this.notificationService.error(
          'Veuillez sélectionner une image valide'
        );
        return;
      }
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error(
          "L'image est trop volumineuse (max 5MB)"
        );
        return;
      }

      this.selectedCoverImage = file;
      this.createImagePreview(file);
    }
  }

  createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedCoverImage = null;
    this.imagePreview = null;
    this.notificationService.info("L'image a été supprimée");
  }

  onSubmit(): void {
    if (this.bookForm.invalid) {
      this.markFormGroupTouched(this.bookForm);
      this.notificationService.error(
        'Veuillez corriger les erreurs du formulaire'
      );
      return;
    }

    this.loading = true;
    const bookData = { ...this.bookForm.value };

    // Convertir les chaînes vides en null pour les champs optionnels
    const optionalFields = [
      'isbn',
      'publisher',
      'genre',
      'language',
      'publishedYear',
      'pageCount',
    ];
    optionalFields.forEach((field) => {
      if (bookData[field] === '' || bookData[field] === undefined) {
        bookData[field] = null;
      }
    });

    // Convertir null en undefined pour respecter le typage
    const coverFile = this.selectedCoverImage || undefined;

    this.bookService.addBook(bookData, coverFile).subscribe({
      next: (createdBook) => {
        this.loading = false;
        this.notificationService.success('Ressource ajoutée avec succès');
        this.router.navigate(['/admin/books']);
      },
      error: (error) => {
        this.loading = false;
        console.error("Erreur lors de l'ajout de la ressource:", error);

        // Gestion des erreurs spécifiques
        if (
          error.error?.message?.includes(
            'Unique constraint failed on the fields: (`isbn`)'
          ) ||
          error.status === 409
        ) {
          this.notificationService.error(
            'Cet ISBN existe déjà dans la bibliothèque'
          );
          // Mettre en évidence le champ ISBN
          this.bookForm.get('isbn')?.setErrors({ duplicateIsbn: true });
        } else {
          this.notificationService.error(
            "Erreur lors de l'ajout de la ressource"
          );
        }
      },
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  resetForm(): void {
    this.bookForm.reset({
      type: ResourceType.BOOK,
      language: 'Français',
    });
    this.selectedCoverImage = null;
    this.imagePreview = null;
  }
}
