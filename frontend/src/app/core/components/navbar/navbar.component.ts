import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocomplete,
} from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../../auth/services/auth.service';
import {
  BookService,
  Resource,
  ResourceType,
} from '../../services/book.service';
import { Subject, Subscription, Observable, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  finalize,
  takeUntil,
} from 'rxjs/operators';
import { LocalStorageService } from '../../services/local-storage.service';
import { AssignBorrowingDialogComponent } from '../../../admin/dialogs/assign-borrowing-dialog/assign-borrowing-dialog.component';

interface SearchHistoryItem {
  id: number;
  book: Resource;
  timestamp: number;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  isAdmin = false;
  searchQuery = '';
  isLoading = false;
  filteredSuggestions: Resource[] = [];
  searchHistory: SearchHistoryItem[] = [];
  resourceType = ResourceType;

  private searchInputSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();
  private readonly HISTORY_STORAGE_KEY = 'search_history';
  private readonly MAX_HISTORY_ITEMS = 10;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('autoComplete') autoComplete!: MatAutocomplete;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService,
    private bookService: BookService,
    private storageService: LocalStorageService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Vérification initiale de l'état d'authentification
    // this.checkAuthStatus();

    // S'abonner aux changements d'état d'authentification
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      const wasLoggedIn = this.isLoggedIn;
      this.isLoggedIn = !!user;
      this.isAdmin = user?.role === 'ADMIN';
    });

    // Configuration de l'autocomplétion
    this.setupAutocomplete();

    this.loadSearchHistory();
  }

  // Configuration de l'autocomplétion avec debounce
  private setupAutocomplete(): void {
    this.searchSubscription = this.searchInputSubject
      .pipe(
        debounceTime(300), // Attendre 300ms après la dernière frappe
        distinctUntilChanged(), // Ne pas relancer la recherche si la valeur n'a pas changé
        takeUntil(this.destroy$),
        switchMap((query) => {
          if (!query || query.length < 2) {
            return of([]);
          }

          this.isLoading = true;

          return this.bookService.searchBooks(query).pipe(
            finalize(() => {
              this.isLoading = false;
            }),
            catchError(() => {
              this.notificationService.error('Erreur lors de la recherche');
              return of([]);
            })
          );
        })
      )
      .subscribe({
        next: (books: Resource[]) => {
          this.filteredSuggestions = books;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.filteredSuggestions = [];
        },
      });
  }

  // Méthode appelée à chaque saisie dans le champ de recherche
  onSearchInput(): void {
    this.searchInputSubject.next(this.searchQuery);
  }

  // Méthode appelée lors de la sélection d'une suggestion dans l'autocomplete
  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedTitle = event.option.value;

    // Cas spécial : si c'est l'option "Effacer tout l'historique"
    if (event.option.viewValue.includes("Effacer tout l'historique")) {
      return; // Cette option est gérée séparément par clearAllHistory
    }

    // Chercher d'abord dans les résultats de recherche actifs
    let selectedBook = this.filteredSuggestions.find(
      (book) => book.title === selectedTitle
    );

    // Si le livre n'est pas trouvé dans les résultats de recherche, chercher dans l'historique
    if (!selectedBook && this.searchHistory.length > 0) {
      const historyItem = this.searchHistory.find(
        (item) => item.book.title === selectedTitle
      );
      if (historyItem) {
        selectedBook = historyItem.book;
      }
    }

    if (selectedBook) {
      // Utiliser la nouvelle méthode navigateToBook pour la navigation
      this.navigateToBook(selectedBook);
    } else {
      // Si aucun livre n'a été trouvé (ce qui ne devrait pas arriver normalement)
      // lancer une recherche standard avec le texte sélectionné
      this.searchQuery = selectedTitle;
      this.searchBooks();
    }
  }

  // Méthode pour vérifier l'état d'authentification actuel
  // private checkAuthStatus(): void {
  //   // Vérifier via le service d'authentification qui utilise les cookies
  //   this.authService.isAuthenticated().subscribe((isAuth) => {
  //     this.isLoggedIn = isAuth;
  //   });
  // }

  ngOnDestroy(): void {
    // Nettoyer les abonnements lors de la destruction du composant
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  searchBooks(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { query: this.searchQuery.trim() },
      });

      // Réinitialiser le champ après la recherche
      this.searchQuery = '';
    }
  }

  logout(): void {
    // Utiliser uniquement le service d'authentification pour la déconnexion
    // Cela gérera les cookies côté backend
    this.authService.logout().subscribe({
      next: () => {
        // Le service d'authentification met déjà à jour currentUserSubject
        this.isLoggedIn = false;
        // Ajouter la notification de déconnexion réussie
        this.notificationService.success('Déconnexion réussie');
        // La redirection est gérée par le service d'authentification
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
        // En cas d'erreur, mettre quand même à jour l'état local
        this.isLoggedIn = false;
        this.notificationService.error('Erreur lors de la déconnexion');
      },
    });
  }

  private loadSearchHistory(): void {
    try {
      const historyData = this.storageService.getItem<string>(
        this.HISTORY_STORAGE_KEY
      );

      if (historyData) {
        const history = JSON.parse(historyData) as SearchHistoryItem[];
        if (Array.isArray(history)) {
          this.searchHistory = history;
        } else {
          this.searchHistory = [];
          console.error('Historique de recherche invalide, réinitialisation');
        }
      } else {
        this.searchHistory = [];
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
      this.searchHistory = [];
    }
  }

  private saveSearchHistory(): void {
    try {
      if (!this.searchHistory || !Array.isArray(this.searchHistory)) {
        this.searchHistory = [];
      }
      this.storageService.setItem(
        this.HISTORY_STORAGE_KEY,
        JSON.stringify(this.searchHistory)
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'historique:", error);
    }
  }

  addToHistory(book: Resource): void {
    if (!this.searchHistory || !Array.isArray(this.searchHistory)) {
      this.searchHistory = [];
    }

    // D'abord vérifier si le livre est déjà dans l'historique
    const existingIndex = this.searchHistory.findIndex(
      (item) => item.book && item.book.id === book.id
    );

    // Si le livre existe déjà, le supprimer
    if (existingIndex !== -1) {
      this.searchHistory.splice(existingIndex, 1);
    }

    // Ajouter le livre en tête de l'historique
    this.searchHistory.unshift({
      id: Date.now(), // Utiliser le timestamp comme ID unique
      book,
      timestamp: Date.now(),
    });

    // Limiter l'historique au nombre maximum d'éléments
    if (this.searchHistory.length > this.MAX_HISTORY_ITEMS) {
      this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY_ITEMS);
    }

    // Sauvegarder l'historique
    this.saveSearchHistory();
  }

  removeFromHistory(event: Event, itemId: number): void {
    event.stopPropagation(); // Empêcher la navigation

    if (!this.searchHistory || !Array.isArray(this.searchHistory)) {
      this.searchHistory = [];
      return;
    }

    this.searchHistory = this.searchHistory.filter(
      (item) => item && item.id !== itemId
    );
    this.saveSearchHistory();
  }

  clearAllHistory(event: any): void {
    if (event) {
      event.stopPropagation(); // Empêcher la navigation
    }

    // Vider l'historique
    this.searchHistory = [];
    this.saveSearchHistory();

    // Fermer l'autocomplete
    this.searchQuery = '';
    if (this.searchInput) {
      this.searchInput.nativeElement.blur();
    }

    // Forcer la détection de changements
    this.cdr.detectChanges();

    this.notificationService.info('Historique de recherche effacé');
  }

  isInHistory(bookId: string): boolean {
    if (!this.searchHistory || !Array.isArray(this.searchHistory)) {
      return false;
    }
    return this.searchHistory.some(
      (item) => item.book && item.book.id === bookId
    );
  }

  onSearchFocus(): void {
    // Charger l'historique à nouveau pour s'assurer qu'il est à jour
    this.loadSearchHistory();
    // Si l'entrée est vide, afficher les suggestions d'historique
    if (!this.searchQuery) {
      // Pas besoin de faire une recherche ici
    }
  }

  navigateToHistoryBook(source: any, book: Resource): void {
    if (source && typeof source.stopPropagation === 'function') {
      source.stopPropagation(); // Empêcher la propagation de l'événement
    }

    if (book && book.id) {
      // Mise à jour de l'historique
      this.addToHistory(book);
      // Navigation vers la page du livre
      this.router.navigate(['/books', book.id]);
    }
  }

  navigateToBook(book: Resource): void {
    // Ajouter le livre à l'historique
    this.addToHistory(book);

    // Vider le champ de recherche
    this.searchQuery = '';

    // Naviguer vers la page de détails du livre
    this.router.navigate(this.getResourceRoute(book));
  }

  handleImageError(event: Event): void {
    // Remplacer l'image qui n'a pas pu être chargée par l'icône par défaut
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      // Masquer l'image qui a échoué
      imgElement.style.display = 'none';

      // Créer un élément de remplacement (un div avec une icône)
      const parent = imgElement.parentElement;
      if (parent) {
        // Vérifier si un placeholder existe déjà
        const existingPlaceholder = parent.querySelector('.placeholder-image');
        if (!existingPlaceholder) {
          // Créer un div pour le placeholder
          const placeholderDiv = document.createElement('div');
          placeholderDiv.className = 'option-image placeholder-image';

          // Ajouter une icône de livre (using Angular Material icon would be better,
          // but we're working with plain DOM here)
          placeholderDiv.innerHTML = '<span class="material-icons">book</span>';

          // Insérer avant l'image
          parent.insertBefore(placeholderDiv, imgElement);
        }
      }
    }
  }

  getResourceIcon(type: ResourceType): string {
    switch (type) {
      case ResourceType.BOOK:
        return 'book';
      case ResourceType.COMIC:
        return 'import_contacts';
      case ResourceType.DVD:
        return 'movie';
      case ResourceType.GAME:
        return 'sports_esports';
      case ResourceType.MAGAZINE:
        return 'newspaper';
      case ResourceType.AUDIOBOOK:
        return 'headphones';
      default:
        return 'description';
    }
  }

  getResourceRoute(resource: Resource): string[] {
    switch (resource.type) {
      case ResourceType.BOOK:
      case ResourceType.COMIC:
      case ResourceType.AUDIOBOOK:
        return ['/books', resource.id];
      case ResourceType.DVD:
        return ['/dvds', resource.id];
      case ResourceType.GAME:
        return ['/games', resource.id];
      case ResourceType.MAGAZINE:
        return ['/magazines', resource.id];
      default:
        return ['/resources', resource.id];
    }
  }

  openAssignBorrowingDialog(): void {
    const dialogRef = this.dialog.open(AssignBorrowingDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.notificationService.success('Emprunt attribué avec succès');
      }
    });
  }
}
