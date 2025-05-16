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
  ResourceType = ResourceType; // Pour accéder à l'enum dans le template

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Surveillance des changements de type de ressource
    this.bookForm.get('type')?.valueChanges.subscribe((type: ResourceType) => {
      this.updateFormValidators(type);
    });
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
      description: ['', [Validators.required, Validators.minLength(10)]],
      language: ['Français'],
      coverImage: [null],

      // Champs communs aux différents types
      author: [''],
      isbn: [''],
      publisher: [''],
      publishedYear: [null],
      genre: [''],
      pageCount: [null],

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

    // Initialiser les validateurs pour le type par défaut (BOOK)
    this.updateFormValidators(ResourceType.BOOK);
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
    const resourceData = this.prepareResourceData();

    // Convertir null en undefined pour respecter le typage
    const coverFile = this.selectedCoverImage || undefined;

    this.bookService.addBook(resourceData, coverFile).subscribe({
      next: (createdResource) => {
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

  private prepareResourceData(): any {
    const resourceData = { ...this.bookForm.value };
    const resourceType = resourceData.type;

    // Suppression des champs non pertinents selon le type de ressource
    if (resourceType !== ResourceType.DVD) {
      delete resourceData.director;
      delete resourceData.actors;
      delete resourceData.duration;
    }

    if (resourceType !== ResourceType.GAME) {
      delete resourceData.developer;
      delete resourceData.platform;
      delete resourceData.pegiRating;
    }

    if (resourceType !== ResourceType.MAGAZINE) {
      delete resourceData.issueNumber;
      delete resourceData.frequency;
    }

    if (
      resourceType !== ResourceType.BOOK &&
      resourceType !== ResourceType.COMIC &&
      resourceType !== ResourceType.AUDIOBOOK
    ) {
      delete resourceData.isbn;
    }

    // Convertir les chaînes vides en null
    Object.keys(resourceData).forEach((key) => {
      if (resourceData[key] === '' || resourceData[key] === undefined) {
        resourceData[key] = null;
      }
    });

    return resourceData;
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

    // Mettre à jour les validateurs pour le type par défaut
    this.updateFormValidators(ResourceType.BOOK);
  }

  // Méthode pour vérifier si un champ doit être affiché selon le type
  shouldShowField(fieldName: string, type: ResourceType): boolean {
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
      case 'publisher':
        return [
          ResourceType.BOOK,
          ResourceType.COMIC,
          ResourceType.MAGAZINE,
        ].includes(type);
      case 'publishedYear':
        return true; // Disponible pour tous les types
      case 'pageCount':
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

  // Méthode pour obtenir le label approprié pour les champs selon le type
  getFieldLabel(fieldName: string, type: ResourceType): string {
    switch (fieldName) {
      case 'author':
        if (type === ResourceType.COMIC) return 'Scénariste/Dessinateur';
        if (type === ResourceType.AUDIOBOOK) return 'Auteur/Narrateur';
        return 'Auteur';
      case 'publisher':
        if (type === ResourceType.MAGAZINE) return 'Éditeur/Revue';
        return 'Éditeur';
      case 'publishedYear':
        if (type === ResourceType.GAME) return 'Année de sortie';
        if (type === ResourceType.DVD) return 'Année de sortie';
        return 'Année de publication';
      case 'genre':
        if (type === ResourceType.GAME) return 'Genre/Catégorie';
        if (type === ResourceType.DVD) return 'Genre/Catégorie';
        return 'Genre';
      default:
        return fieldName;
    }
  }

  // Méthode pour obtenir le placeholder approprié pour les champs selon le type
  getFieldPlaceholder(fieldName: string, type: ResourceType): string {
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
            return 'Titre';
        }
      case 'author':
        if (type === ResourceType.COMIC) return 'Ex: Alan Moore, Dave Gibbons';
        if (type === ResourceType.AUDIOBOOK)
          return 'Ex: J.K. Rowling, Stephen Fry';
        return 'Ex: Victor Hugo';
      case 'genre':
        if (type === ResourceType.GAME) return 'Ex: RPG, Plateforme, FPS';
        if (type === ResourceType.DVD) return 'Ex: Action, Comédie, Drame';
        return 'Ex: Science-Fiction, Roman, Biographie';
      default:
        return `Saisir ${fieldName}`;
    }
  }
}
