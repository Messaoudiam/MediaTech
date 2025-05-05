import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private readonly storageUrl = environment.supabase.storageUrl;
  private readonly resourcesBucket = environment.supabase.resourcesBucket;
  // Image par défaut en base64 (petite image grise)
  private readonly defaultImageBase64 =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAyADIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD7+ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigA//Z';

  constructor() {}

  /**
   * Génère l'URL complète pour une image stockée dans Supabase
   * @param path Chemin de l'image dans le bucket
   * @returns L'URL complète de l'image
   */
  getImageUrl(path: string): string {
    if (!path) {
      return this.defaultImageBase64;
    }

    // Si l'URL est déjà complète (commence par http), la retourner telle quelle
    if (path.startsWith('http')) {
      return path;
    }

    // Nettoyage du chemin
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // Construction de l'URL complète
    return `${this.storageUrl}/${this.resourcesBucket}/${cleanPath}`;
  }

  /**
   * Vérifie si un chemin d'image est valide et retourne une image par défaut si nécessaire
   * @param path Chemin de l'image
   * @returns URL de l'image ou de l'image par défaut
   */
  getSafeImageUrl(path: string): string {
    try {
      return this.getImageUrl(path);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'URL de l'image:",
        error
      );
      return this.defaultImageBase64;
    }
  }

  /**
   * Extrait le nom du fichier à partir d'un chemin complet
   * @param path Chemin complet
   * @returns Nom du fichier
   */
  getFileNameFromPath(path: string): string {
    if (!path) return '';

    // Pour les URLs complètes, extraire le dernier segment
    if (path.includes('/')) {
      const segments = path.split('/');
      return segments[segments.length - 1];
    }

    return path;
  }
}
