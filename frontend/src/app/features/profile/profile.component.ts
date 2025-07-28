import { Component, OnInit } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';

import { User } from '../../auth/models/auth.model';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule
],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  loading = true;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà chargé dans le service
    this.user = this.authService.currentUser;

    if (this.user) {
      this.loading = false;
    } else {
      this.loadUserProfile();
    }
  }

  loadUserProfile(): void {
    this.loading = true;

    // S'abonner au flux d'utilisateur courant
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          this.loading = false;
        } else {
          // Si pas d'utilisateur dans le flux, faire un appel réseau
          this.authService.getUserProfile().subscribe({
            next: (userData) => {
              this.user = userData;
              this.loading = false;
            },
            error: (error) => {
              console.error('Erreur lors du chargement du profil:', error);
              this.loading = false;
              this.router.navigate(['/auth/login']);
            },
          });
        }
      },
    });
  }

  navigateToBorrowings(): void {
    this.router.navigate(['/borrowings']);
  }

  navigateToFavorites(): void {
    this.router.navigate(['/favorites']);
  }
}
