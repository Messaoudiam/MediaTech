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
      // Champs spécifiques aux DVD
      director: [''],
      actors: [''],
      duration: [null],
      // Champs spécifiques aux jeux vidéo
      developer: [''],
      platform: [''],
      pegiRating: [null],
      // Champs spécifiques aux magazines
      issueNumber: [''],
      frequency: [''],
    });

    // Surveillance des changements de type de ressource
    this.bookForm.get('type')?.valueChanges.subscribe((type: ResourceType) => {
      this.updateFormValidators(type);
    });
  }

  private updateFormValidators(resourceType: ResourceType): void {
    // Réinitialiser tous les validateurs
    const fields = [
      'author',
      'isbn',
      'publisher',
      'publishedYear',
      'genre',
      'pageCount',
      'director',
      'actors',
      'duration',
      'developer',
      'platform',
      'pegiRating',
      'issueNumber',
      'frequency',
    ];

    fields.forEach((field) => {
      this.bookForm.get(field)?.clearValidators();
      this.bookForm.get(field)?.updateValueAndValidity();
    });

    // Appliquer les validateurs spécifiques au type de ressource
    switch (resourceType) {
      case ResourceType.BOOK:
      case ResourceType.AUDIOBOOK:
        this.bookForm
          .get('author')
          ?.setValidators([
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
          ]);
        this.bookForm
          .get('isbn')
          ?.setValidators([
            Validators.pattern(
              /^(?:\d[- ]?){9}[\dXx]$|^\d{13}$|^(?:\d[-]?){12}\d$/
            ),
          ]);
        this.bookForm.get('publisher')?.setValidators([]);
        this.bookForm
          .get('publishedYear')
          ?.setValidators([
            Validators.min(1000),
            Validators.max(new Date().getFullYear()),
          ]);
        this.bookForm.get('pageCount')?.setValidators([Validators.min(1)]);
        break;

      case ResourceType.COMIC:
        this.bookForm
          .get('author')
          ?.setValidators([
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
          ]);
        this.bookForm.get('publisher')?.setValidators([Validators.required]);
        this.bookForm.get('pageCount')?.setValidators([Validators.min(1)]);
        this.bookForm
          .get('publishedYear')
          ?.setValidators([
            Validators.min(1000),
            Validators.max(new Date().getFullYear()),
          ]);
        break;

      case ResourceType.DVD:
        this.bookForm.get('director')?.setValidators([Validators.required]);
        this.bookForm.get('actors')?.setValidators([]);
        this.bookForm.get('duration')?.setValidators([Validators.min(1)]);
        this.bookForm
          .get('publishedYear')
          ?.setValidators([
            Validators.min(1900),
            Validators.max(new Date().getFullYear()),
          ]);
        break;

      case ResourceType.GAME:
        this.bookForm.get('developer')?.setValidators([Validators.required]);
        this.bookForm.get('platform')?.setValidators([Validators.required]);
        this.bookForm
          .get('pegiRating')
          ?.setValidators([Validators.min(3), Validators.max(18)]);
        this.bookForm
          .get('publishedYear')
          ?.setValidators([
            Validators.min(1970),
            Validators.max(new Date().getFullYear()),
          ]);
        break;

      case ResourceType.MAGAZINE:
        this.bookForm.get('publisher')?.setValidators([Validators.required]);
        this.bookForm.get('issueNumber')?.setValidators([]);
        this.bookForm.get('frequency')?.setValidators([]);
        this.bookForm.get('pageCount')?.setValidators([Validators.min(1)]);
        break;
    }

    // Mettre à jour les validateurs
    fields.forEach((field) => {
      this.bookForm.get(field)?.updateValueAndValidity();
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
      // Champs spécifiques aux DVD
      director: book.director,
      actors: book.actors,
      duration: book.duration,
      // Champs spécifiques aux jeux vidéo
      developer: book.developer,
      platform: book.platform,
      pegiRating: book.pegiRating,
      // Champs spécifiques aux magazines
      issueNumber: book.issueNumber,
      frequency: book.frequency,
    });

    // Mise à jour des validateurs en fonction du type
    this.updateFormValidators(book.type);
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
      'publishedYear',
      'genre',
      'pageCount',
      'director',
      'actors',
      'duration',
      'developer',
      'platform',
      'pegiRating',
      'issueNumber',
      'frequency',
    ];

    optionalFields.forEach((field) => {
      if (bookData[field] === '') {
        bookData[field] = null;
      }
    });

    // Ajouter un indicateur de suppression d'image si nécessaire
    if (this.shouldRemoveCoverImage) {
      bookData.removeCoverImage = true;
    }

    this.bookService
      .updateBook(this.bookId, bookData, this.selectedCoverImage || undefined)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.notificationService.error(
            'Erreur lors de la mise à jour de la ressource. Veuillez réessayer.'
          );
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((response) => {
        if (response) {
          this.notificationService.success('Ressource mise à jour avec succès');
          this.router.navigate(['/admin/resources']);
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/resources']);
  }

  // Méthodes pour la gestion conditionnelle des champs en fonction du type
  shouldShowField(fieldName: string, type: ResourceType): boolean {
    if (!type) return false;

    switch (fieldName) {
      case 'author':
        return [
          ResourceType.BOOK,
          ResourceType.COMIC,
          ResourceType.AUDIOBOOK,
        ].includes(type);
      case 'isbn':
        return [
          ResourceType.BOOK,
          ResourceType.COMIC,
          ResourceType.AUDIOBOOK,
        ].includes(type);
      case 'pageCount':
        return [
          ResourceType.BOOK,
          ResourceType.COMIC,
          ResourceType.MAGAZINE,
        ].includes(type);
      case 'publisher':
        return [
          ResourceType.BOOK,
          ResourceType.COMIC,
          ResourceType.MAGAZINE,
        ].includes(type);
      case 'director':
      case 'actors':
      case 'duration':
        return type === ResourceType.DVD;
      case 'developer':
      case 'platform':
      case 'pegiRating':
        return type === ResourceType.GAME;
      case 'issueNumber':
      case 'frequency':
        return type === ResourceType.MAGAZINE;
      default:
        return true;
    }
  }

  getFieldLabel(fieldName: string, type: ResourceType): string {
    if (!type) return '';

    switch (fieldName) {
      case 'author':
        return type === ResourceType.COMIC ? 'Auteur / Illustrateur' : 'Auteur';
      case 'publisher':
        return type === ResourceType.MAGAZINE
          ? 'Éditeur / Publication'
          : 'Éditeur';
      case 'publishedYear':
        switch (type) {
          case ResourceType.GAME:
            return 'Année de sortie';
          case ResourceType.DVD:
            return 'Année de sortie';
          case ResourceType.MAGAZINE:
            return 'Année de publication';
          default:
            return 'Année de publication';
        }
      case 'genre':
        switch (type) {
          case ResourceType.GAME:
            return 'Genre / Catégorie';
          case ResourceType.DVD:
            return 'Genre / Catégorie';
          default:
            return 'Genre';
        }
      default:
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    }
  }

  getFieldPlaceholder(fieldName: string, type: ResourceType): string {
    if (!type) return '';

    switch (fieldName) {
      case 'title':
        switch (type) {
          case ResourceType.BOOK:
            return 'Titre du livre';
          case ResourceType.COMIC:
            return 'Titre de la BD';
          case ResourceType.DVD:
            return 'Titre du film/série';
          case ResourceType.GAME:
            return 'Titre du jeu';
          case ResourceType.MAGAZINE:
            return 'Titre du magazine';
          case ResourceType.AUDIOBOOK:
            return 'Titre du livre audio';
          default:
            return 'Titre de la ressource';
        }
      case 'author':
        switch (type) {
          case ResourceType.COMIC:
            return 'Ex: Alan Moore, Dave Gibbons';
          case ResourceType.BOOK:
            return 'Ex: Victor Hugo';
          case ResourceType.AUDIOBOOK:
            return 'Ex: Agatha Christie';
          default:
            return 'Auteur de la ressource';
        }
      case 'genre':
        switch (type) {
          case ResourceType.BOOK:
          case ResourceType.AUDIOBOOK:
            return 'Ex: Science-Fiction, Policier';
          case ResourceType.COMIC:
            return 'Ex: Super-héros, Humour';
          case ResourceType.DVD:
            return 'Ex: Action, Comédie, Drame';
          case ResourceType.GAME:
            return 'Ex: FPS, RPG, Simulation';
          case ResourceType.MAGAZINE:
            return 'Ex: Mode, Cuisine, Actualité';
          default:
            return 'Genre de la ressource';
        }
      default:
        return 'Valeur pour ' + fieldName;
    }
  }
}
