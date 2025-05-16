import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NavbarComponent } from '../../core/components/navbar/navbar.component';
import {
  BookService,
  Resource,
  ResourceType,
} from '../../core/services/book.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../auth/services/auth.service';
import { ImageService } from '../../core/services/image.service';
import { switchMap, catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { BorrowDialogComponent } from '../../features/borrowing/borrow-dialog/borrow-dialog.component';
import { BookCopiesComponent } from '../components/book-copies/book-copies.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    NavbarComponent,
    BookCopiesComponent,
  ],
})
export class BookDetailComponent implements OnInit {
  resource: Resource | null = null;
  loading = true;
  error = false;
  isFavorite = false;
  isLoggedIn = false;
  isAdmin = false;
  resourceType = ResourceType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private favoriteService: FavoriteService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private dialog: MatDialog,
    public imageService: ImageService,
    private location: Location
  ) {}

  ngOnInit(): void {
    // Vérifier l'état d'authentification (juste pour mettre à jour l'état, pas pour bloquer l'accès)
    this.checkAuthStatus();
    // Charger les détails de la ressource, accessible à tous
    this.loadResourceDetails();
  }

  private checkAuthStatus(): void {
    // Vérifier si l'utilisateur est connecté via le service
    this.authService.isAuthenticated().subscribe((isAuthenticated) => {
      this.isLoggedIn = isAuthenticated;

      if (isAuthenticated) {
        // Si authentifié, récupérer le profil utilisateur complet
        this.authService.getUserProfile().subscribe((user) => {
          this.isAdmin = user?.role === 'ADMIN';

          // Si l'utilisateur est connecté et que la ressource est chargée, vérifier l'état des favoris
          if (this.resource) {
            this.checkFavoriteStatus(this.resource.id);
          }
        });
      }
    });
  }

  private loadResourceDetails(): void {
    this.loading = true;
    this.error = false;

    this.route.paramMap
      .pipe(
        take(1), // Prendre seulement la première valeur pour éviter de multiples souscriptions
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            this.error = true;
            this.loading = false;
            return of(null);
          }
          console.log(`Chargement des détails de la ressource ${id}`);
          return this.bookService.getBookById(id).pipe(
            catchError((error) => {
              console.error(
                `Erreur lors du chargement de la ressource ${id}:`,
                error
              );
              this.error = true;
              this.loading = false;
              this.notificationService.error('Ressource non trouvée');
              return of(null);
            })
          );
        })
      )
      .subscribe((resource) => {
        this.resource = resource;
        this.loading = false;

        if (resource) {
          console.log('Ressource chargée avec succès:', resource);
          console.log('Exemplaires de la ressource:', resource.copies);

          // Afficher la notification pour tous les utilisateurs
          this.notificationService.info(`Vous consultez ${resource.title}`);

          // Vérifier l'état des favoris seulement si l'utilisateur est connecté
          if (this.isLoggedIn) {
            this.checkFavoriteStatus(resource.id);
          }
        }
      });
  }

  private checkFavoriteStatus(resourceId: string): void {
    if (!this.isLoggedIn) return;

    this.favoriteService
      .isResourceFavorite(resourceId)
      .subscribe((isFavorite: boolean) => {
        this.isFavorite = isFavorite;
      });
  }

  goBack(): void {
    // Utiliser l'historique de navigation pour revenir à la page précédente
    this.location.back();
  }

  toggleFavorite(): void {
    // Vérification de l'authentification uniquement pour les fonctionnalités réservées
    if (!this.isLoggedIn) {
      this.notificationService.warning(
        'Veuillez vous connecter pour ajouter des ressources à vos favoris'
      );
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.resource) return;

    if (this.isFavorite) {
      this.favoriteService.removeFavorite(this.resource.id).subscribe(() => {
        this.isFavorite = false;
        this.notificationService.info('Retiré des favoris');
      });
    } else {
      this.favoriteService.addFavorite(this.resource.id).subscribe(() => {
        this.isFavorite = true;
        this.notificationService.success('Ajouté aux favoris');
      });
    }
  }

  borrowResource(): void {
    // Vérification de l'authentification uniquement pour les fonctionnalités réservées
    if (!this.isLoggedIn) {
      this.notificationService.warning(
        'Veuillez vous connecter pour emprunter des ressources'
      );
      this.router.navigate(['/auth/login']);
      return;
    }

    // Vérifier si l'utilisateur est administrateur
    if (!this.isAdmin) {
      this.notificationService.warning(
        'Seuls les administrateurs peuvent attribuer des ressources aux utilisateurs'
      );
      return;
    }

    if (!this.resource) return;

    // Vérifier si la ressource a des exemplaires
    if (!this.resource.copies || this.resource.copies.length === 0) {
      this.notificationService.warning(
        'Aucun exemplaire disponible pour cette ressource'
      );
      return;
    }

    // Vérifier si au moins un exemplaire est disponible
    const availableCopies = this.resource.copies.filter(
      (copy) => copy.available
    );
    if (availableCopies.length === 0) {
      this.notificationService.warning(
        'Tous les exemplaires sont actuellement empruntés'
      );
      return;
    }

    // Ouvrir la fenêtre de dialogue d'emprunt
    const dialogRef = this.dialog.open(BorrowDialogComponent, {
      width: '400px',
      data: {
        resourceId: this.resource.id,
        resourceTitle: this.resource.title,
        copies: this.resource.copies,
      },
    });

    // Gérer le résultat du dialogue
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Si le dialogue retourne true, c'est que l'emprunt a été effectué avec succès
        // Recharger les données de la ressource pour mettre à jour les exemplaires disponibles
        this.loadResourceDetails();

        // On peut rediriger vers la liste des emprunts
        this.router.navigate(['/borrowings']);
      }
    });
  }

  /**
   * Obtenir l'URL complète de l'image depuis Supabase
   */
  getCoverUrl(coverImageUrl: string | undefined): string {
    return this.imageService.getSafeImageUrl(coverImageUrl || '');
  }

  /**
   * Gérer les erreurs de chargement d'image
   */
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.imageService.getSafeImageUrl('');
    }
  }

  getResourceIcon(type: ResourceType | undefined): string {
    if (!type) return 'description';

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

  debugCopies(): void {
    if (this.resource && this.resource.copies) {
      console.log('Exemplaires de la ressource:', this.resource.copies);
    }
  }
}
