import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import {
  BookService,
  Resource,
  ResourceType,
} from '../../core/services/book.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  catchError,
  finalize,
  switchMap,
  tap,
  takeUntil,
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-book-edit',
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
  templateUrl: './book-edit.component.html',
  styleUrls: ['./book-edit.component.scss'],
})
export class BookEditComponent implements OnInit, OnDestroy {
  bookForm!: FormGroup;
  loading = false;
  loadingBook = false;
  bookId: string = '';
  selectedCoverImage: File | null = null;
  imagePreview: string | null = null;
  currentBook: Resource | null = null;
  shouldRemoveCoverImage = false;
  private destroy$ = new Subject<void>();

  resourceTypes = Object.values(ResourceType);

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est bien un admin
    this.authService.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        tap((user) => {
          if (!user || user.role?.toLowerCase() !== 'admin') {
            this.notificationService.error('Accès non autorisé');
            this.router.navigate(['/']);
            return;
          }

          this.initForm();
          this.loadBookData();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBookData(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const id = params.get('id');
          if (id) {
            this.bookId = id;
            this.loadingBook = true;
            return this.bookService.getBookById(id).pipe(
              tap((book) => {
                this.currentBook = book;
                this.populateForm(book);
                if (book.coverImageUrl) {
                  this.imagePreview = book.coverImageUrl;
                }
              }),
              catchError((error) => {
                console.error('Erreur lors du chargement du livre:', error);
                this.notificationService.error('Livre introuvable');
                this.router.navigate(['/admin']);
                return of(null);
              }),
              finalize(() => {
                this.loadingBook = false;
              })
            );
          }
          return of(null);
        })
      )
      .subscribe();
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
    });
  }

  populateForm(book: Resource): void {
    this.bookForm.patchValue({
      title: book.title,
      type: book.type,
      author: book.author,
      isbn: book.isbn,
      publisher: book.publisher,
      publishedYear: book.publishedYear,
      description: book.description,
      genre: book.genre,
      pageCount: book.pageCount,
      language: book.language,
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
    // Si nous supprimons l'image d'une ressource existante
    if (this.currentBook?.coverImageUrl) {
      this.imagePreview = null;
      // Indiquer que l'image doit être supprimée lors de la sauvegarde
      this.shouldRemoveCoverImage = true;
      this.notificationService.info(
        "L'image sera supprimée lors de la sauvegarde"
      );
    } else {
      this.imagePreview = null;
      this.notificationService.info("L'image a été supprimée");
    }
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

    // Si on doit supprimer l'image de couverture, ajouter un champ spécial
    if (this.shouldRemoveCoverImage) {
      bookData.removeCoverImage = 'true';
    }

    // Convertir null en undefined pour respecter le typage
    const coverFile = this.selectedCoverImage || undefined;

    const bookId = this.bookId as string;

    this.bookService.updateBook(bookId, bookData, coverFile).subscribe({
      next: (updatedBook) => {
        this.loading = false;
        this.shouldRemoveCoverImage = false; // Réinitialiser le flag
        this.notificationService.success('Ressource mise à jour avec succès');
        this.router.navigate(['/admin/books']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Erreur lors de la mise à jour de la ressource:', error);

        // Message d'erreur plus détaillé
        let errorMessage = 'Erreur lors de la mise à jour de la ressource';

        if (error.status === 400) {
          errorMessage = 'Erreur de validation des données';
          if (error.error?.message) {
            errorMessage = `Erreur: ${error.error.message}`;
          }
        } else if (error.status === 404) {
          errorMessage = 'Ressource non trouvée';
        } else if (error.status === 409) {
          errorMessage = 'Cet ISBN existe déjà dans la bibliothèque';
          // Mettre en évidence le champ ISBN
          this.bookForm.get('isbn')?.setErrors({ duplicateIsbn: true });
        }

        this.notificationService.error(errorMessage);
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

  goBack(): void {
    this.router.navigate(['/admin/books']);
  }
}
