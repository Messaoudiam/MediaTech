import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Resource, ResourceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/services/storage.service';

@Injectable()
export class ResourcesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ResourceWhereUniqueInput;
    where?: Prisma.ResourceWhereInput;
    orderBy?: Prisma.ResourceOrderByWithRelationInput;
  }): Promise<Resource[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.resource.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        copies: true,
      },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return resource;
  }

  async create(
    data: Prisma.ResourceCreateInput,
    coverImage?: Buffer,
    mimetype?: string,
  ): Promise<Resource> {
    // Si une image de couverture est fournie, télécharger vers Supabase
    let coverImageUrl: string | null = null;

    if (coverImage) {
      const resourceType = data.type.toString().toLowerCase();
      // console.log(
      //   "DEBUG: Tentative d'upload vers Supabase, type:",
      //   resourceType,
      //   'mimetype:',
      //   mimetype,
      // );
      coverImageUrl = await this.storageService.uploadImage(
        coverImage,
        resourceType,
        mimetype,
      );
      // console.log('DEBUG: URL image uploadée:', coverImageUrl);
    }

    // Créer la ressource avec l'URL de l'image
    return this.prisma.resource.create({
      data: {
        ...data,
        coverImageUrl,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.ResourceUpdateInput,
    coverImage?: Buffer,
    mimetype?: string,
    shouldRemoveCoverImage: boolean = false,
  ): Promise<Resource> {
    try {
      // console.log('DEBUG - Service de mise à jour appelé avec:');
      // console.log(' - ID:', id);
      // console.log(' - Image fournie:', !!coverImage);
      // console.log(" - Demande de suppression d'image:", shouldRemoveCoverImage);

      // Vérifier si la ressource existe
      const existingResource = await this.prisma.resource.findUnique({
        where: { id },
      });

      if (!existingResource) {
        throw new NotFoundException(`Resource with ID ${id} not found`);
      }

      console.log(
        'DEBUG - Ressource existante:',
        existingResource.id,
        existingResource.title,
      );
      console.log('DEBUG - Image existante:', existingResource.coverImageUrl);

      // Si une nouvelle image de couverture est fournie
      if (coverImage) {
        console.log('DEBUG - Traitement de la nouvelle image');
        // Supprimer l'ancienne image si elle existe
        if (existingResource.coverImageUrl) {
          try {
            console.log("DEBUG - Suppression de l'ancienne image");
            await this.storageService.deleteImage(
              existingResource.coverImageUrl,
            );
          } catch (error) {
            console.error(
              `Erreur lors de la suppression de l'ancienne image: ${error.message}`,
            );
            // On continue même si la suppression échoue
          }
        }

        // Télécharger la nouvelle image
        const resourceType = (existingResource.type as ResourceType)
          .toString()
          .toLowerCase();
        const newCoverImageUrl = await this.storageService.uploadImage(
          coverImage,
          resourceType,
          mimetype,
        );

        console.log('DEBUG - Nouvelle image URL:', newCoverImageUrl);
        // Ajouter l'URL de la nouvelle image aux données de mise à jour
        data.coverImageUrl = newCoverImageUrl;
      }
      // Si l'utilisateur veut supprimer l'image sans en ajouter une nouvelle
      else if (shouldRemoveCoverImage && existingResource.coverImageUrl) {
        console.log(
          "DEBUG - Suppression de l'image demandée sans nouvelle image",
        );
        // Supprimer l'image existante
        try {
          await this.storageService.deleteImage(existingResource.coverImageUrl);
          console.log('DEBUG - Image supprimée avec succès');
        } catch (error) {
          console.error(
            `Erreur lors de la suppression de l'image: ${error.message}`,
          );
          // On continue même si la suppression échoue
        }

        // Mettre à null l'URL de l'image
        data.coverImageUrl = null;
        console.log("DEBUG - URL de l'image mise à null");
      }

      // Mettre à jour la ressource
      console.log(
        'DEBUG - Mise à jour de la ressource avec les données:',
        data,
      );
      return this.prisma.resource.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error(
        `Erreur lors de la mise à jour de la ressource ${id}:`,
        error,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<Resource> {
    // Vérifier si la ressource existe
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    // Supprimer l'image de couverture si elle existe
    if (resource.coverImageUrl) {
      await this.storageService.deleteImage(resource.coverImageUrl);
    }

    // Supprimer la ressource
    return this.prisma.resource.delete({
      where: { id },
    });
  }

  // Méthodes pour les favoris
  async addToFavorites(userId: string, resourceId: string): Promise<void> {
    // Vérifier si la ressource existe
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${resourceId} not found`);
    }

    // Ajouter aux favoris (ne rien faire si déjà en favoris grâce à createMany)
    await this.prisma.favorite.create({
      data: {
        userId,
        resourceId,
      },
    });
  }

  async removeFromFavorites(userId: string, resourceId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        resourceId,
      },
    });
  }

  async getFavorites(userId: string): Promise<Resource[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
      },
      include: {
        resource: true,
      },
    });

    return favorites.map((favorite) => favorite.resource);
  }
}
