import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    // Vérifier si la ressource existe
    const resource = await this.prisma.resource.findUnique({
      where: { id: createReviewDto.resourceId },
    });

    if (!resource) {
      throw new NotFoundException('Ressource non trouvée');
    }

    // Vérifier si l'utilisateur a déjà laissé un avis sur cette ressource
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_resourceId: {
          userId,
          resourceId: createReviewDto.resourceId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'Vous avez déjà laissé un avis sur cette ressource',
      );
    }

    // Créer l'avis
    return this.prisma.review.create({
      data: {
        userId,
        resourceId: createReviewDto.resourceId,
        content: createReviewDto.content,
        rating: createReviewDto.rating,
      },
    });
  }

  async findAll() {
    return this.prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        resource: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });
  }

  async findByResource(resourceId: string) {
    return this.prisma.review.findMany({
      where: { resourceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async findUserReviewForResource(userId: string, resourceId: string) {
    return this.prisma.review.findUnique({
      where: {
        userId_resourceId: {
          userId,
          resourceId,
        },
      },
    });
  }

  async update(
    userId: string,
    resourceId: string,
    updateReviewDto: UpdateReviewDto,
  ) {
    // Vérifier si l'avis existe
    const review = await this.prisma.review.findUnique({
      where: {
        userId_resourceId: {
          userId,
          resourceId,
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    // Mettre à jour l'avis
    return this.prisma.review.update({
      where: {
        userId_resourceId: {
          userId,
          resourceId,
        },
      },
      data: updateReviewDto,
    });
  }

  async remove(userId: string, resourceId: string) {
    // Vérifier si l'avis existe
    const review = await this.prisma.review.findUnique({
      where: {
        userId_resourceId: {
          userId,
          resourceId,
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    // Supprimer l'avis
    return this.prisma.review.delete({
      where: {
        userId_resourceId: {
          userId,
          resourceId,
        },
      },
    });
  }
}
