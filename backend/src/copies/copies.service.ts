import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Copy, Prisma } from '@prisma/client';
import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';

@Injectable()
export class CopiesService {
  constructor(private prisma: PrismaService) {}

  // Créer un nouvel exemplaire
  async create(createCopyDto: CreateCopyDto): Promise<Copy> {
    console.log(
      "Service - Création d'un exemplaire pour la ressource:",
      createCopyDto.resourceId,
    );

    // Vérifier si la ressource existe
    const resource = await this.prisma.resource.findUnique({
      where: { id: createCopyDto.resourceId },
    });

    if (!resource) {
      throw new NotFoundException(
        `Ressource avec l'ID ${createCopyDto.resourceId} non trouvée`,
      );
    }

    // Créer les données au format attendu par Prisma
    const data: Prisma.CopyCreateInput = {
      condition: createCopyDto.condition || 'Bon état',
      available: createCopyDto.available ?? true,
      resource: {
        connect: { id: createCopyDto.resourceId },
      },
    };

    return this.prisma.copy.create({
      data,
      include: {
        resource: true,
      },
    });
  }

  // Récupérer tous les exemplaires
  async findAll(resourceId?: string, available?: boolean): Promise<Copy[]> {
    console.log('Service - Récupération des exemplaires');

    const where: Prisma.CopyWhereInput = {};

    if (resourceId) {
      where.resource = { id: resourceId };
    }

    if (available !== undefined) {
      where.available = available;
    }

    return this.prisma.copy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        resource: true,
      },
    });
  }

  // Récupérer un exemplaire par son ID
  async findOne(id: string): Promise<Copy> {
    console.log(`Service - Récupération de l'exemplaire ${id}`);

    const copy = await this.prisma.copy.findUnique({
      where: { id },
      include: {
        resource: true,
      },
    });

    if (!copy) {
      throw new NotFoundException(`Exemplaire avec l'ID ${id} non trouvé`);
    }

    return copy;
  }

  // Mettre à jour un exemplaire
  async update(id: string, updateCopyDto: UpdateCopyDto): Promise<Copy> {
    console.log(`Service - Mise à jour de l'exemplaire ${id}`);

    // Vérifier si l'exemplaire existe
    const existingCopy = await this.prisma.copy.findUnique({
      where: { id },
    });

    if (!existingCopy) {
      throw new NotFoundException(`Exemplaire avec l'ID ${id} non trouvé`);
    }

    // Construire les données de mise à jour
    const data: Prisma.CopyUpdateInput = {};

    if (updateCopyDto.condition !== undefined) {
      data.condition = updateCopyDto.condition;
    }

    if (updateCopyDto.available !== undefined) {
      data.available = updateCopyDto.available;
    }

    return this.prisma.copy.update({
      where: { id },
      data,
      include: {
        resource: true,
      },
    });
  }

  // Supprimer un exemplaire
  async remove(id: string): Promise<Copy> {
    console.log(`Service - Suppression de l'exemplaire ${id}`);

    // Vérifier si l'exemplaire existe
    const existingCopy = await this.prisma.copy.findUnique({
      where: { id },
      include: { borrowings: { where: { returnedAt: null } } },
    });

    if (!existingCopy) {
      throw new NotFoundException(`Exemplaire avec l'ID ${id} non trouvé`);
    }

    // Vérifier si l'exemplaire est actuellement emprunté
    if (
      !existingCopy.available ||
      (existingCopy.borrowings && existingCopy.borrowings.length > 0)
    ) {
      throw new BadRequestException(
        `Impossible de supprimer l'exemplaire ${id} car il est actuellement emprunté`,
      );
    }

    return this.prisma.copy.delete({
      where: { id },
      include: {
        resource: true,
      },
    });
  }
}
