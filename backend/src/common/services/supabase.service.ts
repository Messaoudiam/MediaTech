import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env } from '../../config/app.config';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService<Env, true>) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_KEY');

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  get client() {
    return this.supabase;
  }

  /**
   * Récupère un objet depuis un bucket de stockage
   * @param bucketName Nom du bucket
   * @param path Chemin vers l'objet
   * @returns Le lien public ou null en cas d'erreur
   */
  async getPublicUrl(bucketName: string, path: string): Promise<string | null> {
    try {
      const { data } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'URL publique:", error);
      return null;
    }
  }

  /**
   * Télécharge un fichier vers un bucket Supabase
   * @param bucketName Nom du bucket
   * @param path Chemin de destination
   * @param file Fichier à télécharger
   * @param mimetype Type MIME du fichier (ex: 'image/jpeg')
   * @returns Le nom du fichier téléchargé ou null en cas d'erreur
   */
  async uploadFile(
    bucketName: string,
    path: string,
    file: Buffer,
    mimetype?: string,
  ): Promise<string | null> {
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const filePath = `${path}/${fileName}`;

      // Détermine un type MIME par défaut si non fourni
      const contentType = mimetype || 'image/jpeg';

      const { error } = await this.supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType, // Ajoute le type MIME correct
        });

      if (error) throw error;
      return filePath;
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      return null;
    }
  }

  /**
   * Supprime un fichier d'un bucket Supabase
   * @param bucketName Nom du bucket
   * @param path Chemin vers le fichier
   * @returns true si supprimé avec succès, false sinon
   */
  async deleteFile(bucketName: string, path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucketName)
        .remove([path]);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  }
}
