import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { BorrowingStatus, Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBorrowingDto,
  UpdateBorrowingDto,
  QueryBorrowingDto,
} from './dto';
import { addDays } from 'date-fns';

@Injectable()
export class BorrowingsService {
  // Constantes pour la gestion des emprunts
  private readonly MAX_ACTIVE_BORROWINGS = 5; // Nombre maximum d'emprunts actifs par utilisateur
  private readonly DEFAULT_BORROWING_DAYS = 14; // Durée d'emprunt par défaut (en jours)
  private readonly MAX_RENEWALS = 1; // Nombre maximum de renouvellements autorisés

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createBorrowingDto: CreateBorrowingDto) {
    // Vérifier si l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, activeBorrowingsCount: true },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    // Vérifier si l'utilisateur a atteint le nombre maximum d'emprunts actifs
    if (user.activeBorrowingsCount >= this.MAX_ACTIVE_BORROWINGS) {
      throw new ForbiddenException(
        `Vous avez atteint le nombre maximum d'emprunts actifs (${this.MAX_ACTIVE_BORROWINGS})`,
      );
    }

    // Vérifier si l'exemplaire existe et est disponible
    const copy = await this.prisma.copy.findUnique({
      where: { id: createBorrowingDto.copyId },
      include: { resource: true },
    });

    if (!copy) {
      throw new NotFoundException(
        `Exemplaire avec l'ID ${createBorrowingDto.copyId} non trouvé`,
      );
    }

    if (!copy.available) {
      throw new BadRequestException(
        `L'exemplaire avec l'ID ${createBorrowingDto.copyId} n'est pas disponible`,
      );
    }

    // Définir la date de retour prévue (par défaut : date actuelle + DEFAULT_BORROWING_DAYS)
    const dueDate = createBorrowingDto.dueDate
      ? new Date(createBorrowingDto.dueDate)
      : addDays(new Date(), this.DEFAULT_BORROWING_DAYS);

    // Créer l'emprunt et mettre à jour le statut de l'exemplaire en transaction
    return this.prisma.$transaction(async (tx) => {
      // Créer l'emprunt
      const borrowing = await tx.borrowing.create({
        data: {
          userId,
          copyId: createBorrowingDto.copyId,
          dueDate,
          status: BorrowingStatus.ACTIVE,
        },
        include: {
          copy: {
            include: {
              resource: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      // Mettre à jour le statut de l'exemplaire
      await tx.copy.update({
        where: { id: createBorrowingDto.copyId },
        data: { available: false },
      });

      // Incrémenter le compteur d'emprunts actifs de l'utilisateur
      await tx.user.update({
        where: { id: userId },
        data: { activeBorrowingsCount: { increment: 1 } },
      });

      return borrowing;
    });
  }

  async findAll(queryDto: QueryBorrowingDto) {
    const {
      userId,
      resourceId,
      status,
      includeResource,
      includeUser,
      skip,
      take,
      search,
    } = queryDto;

    // Construire les conditions de recherche
    const where: Prisma.BorrowingWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (resourceId) {
      where.copy = {
        resource: {
          id: resourceId,
        },
      };
    }

    if (search) {
      where.copy = {
        resource: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    // Construire les options d'inclusion
    const include: Prisma.BorrowingInclude = {
      copy: includeResource
        ? {
            include: {
              resource: true,
            },
          }
        : true,
      user: includeUser
        ? {
            select: {
              id: true,
              email: true,
              role: true,
            },
          }
        : false,
    };

    // Récupérer les emprunts
    const [borrowings, total] = await Promise.all([
      this.prisma.borrowing.findMany({
        where,
        include,
        skip,
        take,
        orderBy: { borrowedAt: 'desc' },
      }),
      this.prisma.borrowing.count({ where }),
    ]);

    return {
      items: borrowings,
      total,
      page: skip ? Math.floor(skip / (take || 10)) + 1 : 1,
      pageSize: take || 10,
      pageCount: Math.ceil(total / (take || 10)),
    };
  }

  async findOne(id: string, includeResource = true, includeUser = false) {
    const borrowing = await this.prisma.borrowing.findUnique({
      where: { id },
      include: {
        copy: includeResource
          ? {
              include: {
                resource: true,
              },
            }
          : true,
        user: includeUser
          ? {
              select: {
                id: true,
                email: true,
                role: true,
              },
            }
          : false,
      },
    });

    if (!borrowing) {
      throw new NotFoundException(`Emprunt avec l'ID ${id} non trouvé`);
    }

    return borrowing;
  }

  async findUserBorrowings(userId: string, status?: BorrowingStatus) {
    const where: Prisma.BorrowingWhereInput = { userId };

    if (status) {
      where.status = status;
    }

    const borrowings = await this.prisma.borrowing.findMany({
      where,
      include: {
        copy: {
          include: {
            resource: true,
          },
        },
      },
      orderBy: { borrowedAt: 'desc' },
    });

    return borrowings;
  }

  async update(
    id: string,
    updateBorrowingDto: UpdateBorrowingDto,
    currentUser: User,
  ) {
    // Récupérer l'emprunt à mettre à jour
    const borrowing = await this.prisma.borrowing.findUnique({
      where: { id },
      include: { copy: true },
    });

    if (!borrowing) {
      throw new NotFoundException(`Emprunt avec l'ID ${id} non trouvé`);
    }

    // Vérifier si l'utilisateur est le propriétaire de l'emprunt ou un admin
    if (borrowing.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier cet emprunt",
      );
    }

    // Si on demande un renouvellement
    if (updateBorrowingDto.renew) {
      // Vérifier si l'emprunt est actif
      if (borrowing.status !== BorrowingStatus.ACTIVE) {
        throw new BadRequestException(
          'Seuls les emprunts actifs peuvent être renouvelés',
        );
      }

      // Vérifier si l'emprunt a déjà été renouvelé (implémentation simplifiée)
      // En pratique, il faudrait compter le nombre de renouvellements dans une colonne dédiée
      const newDueDate = addDays(
        new Date(borrowing.dueDate),
        this.DEFAULT_BORROWING_DAYS,
      );

      return this.prisma.borrowing.update({
        where: { id },
        data: {
          dueDate: newDueDate,
          // Vous pourriez ajouter un champ renewalCount et l'incrémenter ici
        },
        include: {
          copy: {
            include: {
              resource: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });
    }

    // Retour d'un emprunt
    if (updateBorrowingDto.status === BorrowingStatus.RETURNED) {
      return this.returnBorrowing(id, currentUser);
    }

    // Mise à jour simple (commentaires, etc.)
    const { renew, ...updatedData } = updateBorrowingDto;
    return this.prisma.borrowing.update({
      where: { id },
      data: updatedData,
      include: {
        copy: {
          include: {
            resource: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  async returnBorrowing(id: string, currentUser?: User) {
    // Récupérer l'emprunt
    const borrowing = await this.prisma.borrowing.findUnique({
      where: { id },
      include: { user: true, copy: true },
    });

    if (!borrowing) {
      throw new NotFoundException(`Emprunt avec l'ID ${id} non trouvé`);
    }

    // Vérifier si l'emprunt est déjà retourné
    if (borrowing.status === BorrowingStatus.RETURNED) {
      throw new BadRequestException('Cet emprunt a déjà été retourné');
    }

    // Si un utilisateur est fourni (non-admin), vérifier qu'il est le propriétaire de l'emprunt
    if (
      currentUser &&
      currentUser.role !== 'ADMIN' &&
      borrowing.userId !== currentUser.id
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à retourner cet emprunt",
      );
    }

    // Mettre à jour l'emprunt et l'exemplaire en transaction
    return this.prisma.$transaction(async (tx) => {
      // Mettre à jour l'emprunt
      const updatedBorrowing = await tx.borrowing.update({
        where: { id },
        data: {
          status: BorrowingStatus.RETURNED,
          returnedAt: new Date(),
        },
        include: {
          copy: {
            include: {
              resource: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      // Mettre à jour le statut de l'exemplaire
      await tx.copy.update({
        where: { id: borrowing.copyId },
        data: { available: true },
      });

      // Décrémenter le compteur d'emprunts actifs de l'utilisateur
      await tx.user.update({
        where: { id: borrowing.userId },
        data: { activeBorrowingsCount: { decrement: 1 } },
      });

      return updatedBorrowing;
    });
  }

  async checkOverdueBorrowings() {
    const now = new Date();

    // Trouver tous les emprunts actifs dont la date de retour est dépassée
    const overdueBorrowings = await this.prisma.borrowing.findMany({
      where: {
        status: BorrowingStatus.ACTIVE,
        dueDate: {
          lt: now,
        },
      },
    });

    // Mettre à jour tous les emprunts en retard
    const updatePromises = overdueBorrowings.map((borrowing) =>
      this.prisma.borrowing.update({
        where: { id: borrowing.id },
        data: {
          status: BorrowingStatus.OVERDUE,
        },
      }),
    );

    await Promise.all(updatePromises);

    return { updated: updatePromises.length };
  }

  // Cette méthode pourrait être appelée par un cron job
  async processOverdueBorrowings() {
    return this.checkOverdueBorrowings();
  }
}
