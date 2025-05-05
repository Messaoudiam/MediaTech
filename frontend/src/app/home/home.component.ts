import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { FavoritesListComponent } from './favorites-list/favorites-list.component';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    FavoritesListComponent,
    RouterModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  user: any = null;
  loading: boolean = true;
  private userSubscription: Subscription | null = null;
  private isRedirecting: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Si on a déjà un utilisateur, vérifier son rôle
    this.user = this.authService.currentUser;
    if (this.user) {
      // Vérifier si l'utilisateur est un admin, le rediriger si c'est le cas
      if (this.user.role === 'admin' && !this.isRedirecting) {
        this.isRedirecting = true;
        this.router.navigate(['/admin']);
        return;
      }

      this.loading = false;
    } else {
      // Sinon, tenter de récupérer le profil
      this.loading = true;
      this.authService.getUserProfile().subscribe({
        next: (user) => {
          this.user = user;

          // Vérifier si l'utilisateur est un admin, le rediriger si c'est le cas
          if (this.user && this.user.role === 'admin' && !this.isRedirecting) {
            this.isRedirecting = true;
            this.router.navigate(['/admin']);
            return;
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la récupération du profil:', error);
          this.loading = false;
          if (!this.isRedirecting) {
            this.isRedirecting = true;
            this.router.navigate(['/auth/login']);
          }
        },
        complete: () => {
          this.loading = false;
        },
      });
    }

    // S'abonner aux changements d'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.user = user;

      // Si l'utilisateur change et devient admin, rediriger
      if (user && user.role === 'admin' && !this.isRedirecting) {
        this.isRedirecting = true;
        this.router.navigate(['/admin']);
      }
    });
  }

  ngOnDestroy() {
    // Nettoyer l'abonnement lors de la destruction du composant
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.notificationService.success('Déconnexion réussie');
      },
      error: (err) => {
        console.error('Erreur lors de la déconnexion:', err);
        this.notificationService.error('Erreur lors de la déconnexion');
      },
    });
  }

  navigateToBorrowings() {
    if (!this.isRedirecting) {
      this.isRedirecting = true;
      this.router.navigate(['/borrowings']).finally(() => {
        this.isRedirecting = false;
      });
    }
  }

  navigateToLogin() {
    if (!this.isRedirecting) {
      this.isRedirecting = true;
      this.router.navigate(['/auth/login']);
    }
  }
}
