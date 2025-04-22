import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';
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
  ) {
    console.log('HomeComponent initialisé');
  }

  ngOnInit() {
    console.log('HomeComponent.ngOnInit()');
    console.log('Current user from authService:', this.authService.currentUser);

    // Si on a déjà un utilisateur, vérifier son rôle
    this.user = this.authService.currentUser;
    if (this.user) {
      console.log('Utilisateur déjà connecté:', this.user);

      // Vérifier si l'utilisateur est un admin, le rediriger si c'est le cas
      if (this.user.role === 'admin' && !this.isRedirecting) {
        console.log(
          'Utilisateur admin détecté, redirection vers dashboard admin'
        );
        this.isRedirecting = true;
        this.router.navigate(['/admin']);
        return;
      }

      this.loading = false;
    } else {
      // Sinon, tenter de récupérer le profil
      console.log(
        'Aucun utilisateur trouvé, tentative de récupération du profil...'
      );
      this.loading = true;
      this.authService.getUserProfile().subscribe({
        next: (user) => {
          console.log('Profil utilisateur récupéré:', user);
          this.user = user;

          // Vérifier si l'utilisateur est un admin, le rediriger si c'est le cas
          if (this.user && this.user.role === 'admin' && !this.isRedirecting) {
            console.log(
              'Utilisateur admin détecté, redirection vers dashboard admin'
            );
            this.isRedirecting = true;
            this.router.navigate(['/admin']);
            return;
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors de la récupération du profil:', error);
          console.log('Redirection vers la page de connexion...');
          this.loading = false;
          if (!this.isRedirecting) {
            this.isRedirecting = true;
            this.router.navigate(['/auth/login']);
          }
        },
        complete: () => {
          console.log('Récupération du profil terminée');
          this.loading = false;
        },
      });
    }

    // S'abonner aux changements d'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      console.log("Changement d'utilisateur détecté:", user);
      this.user = user;

      // Si l'utilisateur change et devient admin, rediriger
      if (user && user.role === 'admin' && !this.isRedirecting) {
        console.log(
          'Utilisateur admin détecté, redirection vers dashboard admin'
        );
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
    console.log('Déconnexion...');
    this.authService.logout().subscribe({
      next: () => {
        console.log('Déconnexion réussie');
        this.notificationService.success('Déconnexion réussie');
      },
      error: (err) => {
        console.error('Erreur lors de la déconnexion:', err);
        this.notificationService.error('Erreur lors de la déconnexion');
      },
    });
  }

  navigateToLogin() {
    if (!this.isRedirecting) {
      this.isRedirecting = true;
      this.router.navigate(['/auth/login']);
    }
  }
}
