import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  private authSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('Initialisation du NavbarComponent');

    // Vérification initiale de l'état d'authentification
    this.checkAuthStatus();

    // S'abonner aux changements d'état d'authentification
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      const wasLoggedIn = this.isLoggedIn;
      this.isLoggedIn = !!user;

      console.log("État d'authentification mis à jour:", this.isLoggedIn);

      // Si l'état a changé et qu'on n'est plus connecté, ça signifie une déconnexion
      if (wasLoggedIn && !this.isLoggedIn) {
        console.log('Déconnexion détectée via currentUser$');
      }
    });
  }

  // Méthode pour vérifier l'état d'authentification actuel
  private checkAuthStatus(): void {
    // Vérifier via le service d'authentification qui utilise les cookies
    this.authService.isAuthenticated().subscribe((isAuth) => {
      this.isLoggedIn = isAuth;
      console.log(
        "État d'authentification initial (basé sur cookies):",
        this.isLoggedIn
      );
    });
  }

  ngOnDestroy(): void {
    // Nettoyer l'abonnement lors de la destruction du composant
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
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
}
