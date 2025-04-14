// angular
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// services
import { UserManagementService } from '../../services/user-management.service';
import { User } from '../../../auth/models/auth.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  displayedColumns: string[] = ['email', 'role', 'actions'];
  loading = false;
  roles = ['USER', 'ADMIN'];

  constructor(
    private userManagementService: UserManagementService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userManagementService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs', error);
        this.snackBar.open(
          'Erreur lors du chargement des utilisateurs',
          'Fermer',
          {
            duration: 3000,
          }
        );
        this.loading = false;
      },
    });
  }

  updateUserRole(userId: string, newRole: string): void {
    this.loading = true;
    this.userManagementService.updateUserRole(userId, newRole).subscribe({
      next: (updatedUser) => {
        // Mettre à jour l'utilisateur dans le tableau
        const index = this.users.findIndex((user) => user.id === userId);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        this.snackBar.open(`Rôle mis à jour avec succès`, 'Fermer', {
          duration: 3000,
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du rôle', error);
        this.snackBar.open('Erreur lors de la mise à jour du rôle', 'Fermer', {
          duration: 3000,
        });
        this.loading = false;
      },
    });
  }
}
