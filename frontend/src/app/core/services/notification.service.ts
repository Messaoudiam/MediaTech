import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Affiche une notification de succès
   * @param message Message à afficher
   * @param duration Durée d'affichage en ms (défaut: 3000)
   */
  success(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  /**
   * Affiche une notification d'erreur
   * @param message Message à afficher
   * @param duration Durée d'affichage en ms (défaut: 5000)
   */
  error(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  /**
   * Affiche une notification d'information
   * @param message Message à afficher
   * @param duration Durée d'affichage en ms (défaut: 3000)
   */
  info(message: string, duration: number = 3000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  /**
   * Affiche une notification d'avertissement
   * @param message Message à afficher
   * @param duration Durée d'affichage en ms (défaut: 4000)
   */
  warning(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Fermer', {
      duration,
      panelClass: ['warning-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
