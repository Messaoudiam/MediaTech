import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class StorageService {
  private readonly BUCKET_NAME = 'tcl-resource-images';

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Télécharge une image vers le bucket Supabase
   * @param file Fichier image à télécharger
   * @param path Chemin optionnel dans le bucket (ex: 'profile')
   * @param mimetype Type MIME du fichier (ex: 'image/jpeg')
   * @returns URL publique de l'image ou null en cas d'erreur
   */
  async uploadImage(
    file: Buffer,
    path = 'images',
    mimetype?: string,
  ): Promise<string | null> {
    // console.log(
    //   'DEBUG: uploadImage appelé, path:',
    //   path,
    //   'file size:',
    //   file?.length,
    //   'mimetype:',
    //   mimetype,
    // );
    const filePath = await this.supabaseService.uploadFile(
      this.BUCKET_NAME,
      path,
      file,
      mimetype,
    );

    if (!filePath) {
      // console.log('DEBUG: uploadFile a échoué, filePath null');
      return null;
    }

    const publicUrl = await this.supabaseService.getPublicUrl(
      this.BUCKET_NAME,
      filePath,
    );
    // console.log('DEBUG: URL publique obtenue:', publicUrl);
    return publicUrl;
  }

  /**
   * Supprime une image du bucket Supabase
   * @param url URL complète ou chemin de l'image à supprimer
   * @returns true si supprimé avec succès, false sinon
   */
  async deleteImage(url: string): Promise<boolean> {
    // Extraire le chemin relatif de l'URL complète si nécessaire
    const path = url.includes(this.BUCKET_NAME)
      ? url.split(`${this.BUCKET_NAME}/`)[1]
      : url;

    return this.supabaseService.deleteFile(this.BUCKET_NAME, path);
  }

  /**
   * Récupère l'URL publique d'une image
   * @param path Chemin de l'image dans le bucket
   * @returns URL publique de l'image
   */
  getImageUrl(path: string): Promise<string | null> {
    return this.supabaseService.getPublicUrl(this.BUCKET_NAME, path);
  }
}
