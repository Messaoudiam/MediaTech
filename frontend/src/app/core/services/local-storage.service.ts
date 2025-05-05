import { Injectable } from '@angular/core';

/**
 * Service pour gérer les interactions avec le localStorage du navigateur
 * Fournit des méthodes typées pour stocker et récupérer des données
 */
@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  /**
   * Stocke une valeur dans le localStorage
   * @param key La clé sous laquelle stocker la valeur
   * @param value La valeur à stocker (sera convertie en JSON)
   */
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erreur lors du stockage dans localStorage:', error);
    }
  }

  /**
   * Récupère une valeur depuis le localStorage
   * @param key La clé de la valeur à récupérer
   * @returns La valeur typée ou null si non trouvée
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération depuis localStorage:',
        error
      );
      return null;
    }
  }

  /**
   * Supprime une valeur du localStorage
   * @param key La clé de la valeur à supprimer
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(
        'Erreur lors de la suppression depuis localStorage:',
        error
      );
    }
  }

  /**
   * Efface tout le contenu du localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Erreur lors du nettoyage du localStorage:', error);
    }
  }
}
