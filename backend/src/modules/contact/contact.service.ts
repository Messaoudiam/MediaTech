import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { ContactRequestStatus } from '@prisma/client';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une nouvelle demande de contact
   * @param createContactRequestDto Les données de la demande
   * @param userId L'ID de l'utilisateur connecté (optionnel)
   * @returns La demande créée
   */
  async create(
    createContactRequestDto: CreateContactRequestDto,
    userId?: string,
  ) {
    try {
      const { name, email, subject, message } = createContactRequestDto;

      // Création de la demande de contact
      const contactRequest = await this.prisma.contactRequest.create({
        data: {
          userId: userId || null, // Si l'utilisateur n'est pas connecté, userId sera null
          name,
          email,
          subject,
          message,
          status: ContactRequestStatus.PENDING,
        },
      });

      this.logger.log(
        `Nouvelle demande de contact créée avec l'ID: ${contactRequest.id}`,
      );

      // On peut aussi envoyer un email de confirmation ou notifier les administrateurs ici

      return {
        id: contactRequest.id,
        message: 'Votre demande a été soumise avec succès',
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création d'une demande de contact: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Récupère toutes les demandes de contact
   * @returns Liste des demandes de contact
   */
  async findAll() {
    try {
      const contactRequests = await this.prisma.contactRequest.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      return contactRequests;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des demandes de contact: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Récupère une demande de contact par son ID
   * @param id L'ID de la demande
   * @returns La demande de contact
   */
  async findOne(id: string) {
    try {
      const contactRequest = await this.prisma.contactRequest.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!contactRequest) {
        throw new NotFoundException(
          `Demande de contact avec l'ID ${id} non trouvée`,
        );
      }

      return contactRequest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la récupération d'une demande de contact: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Met à jour le statut d'une demande de contact
   * @param id L'ID de la demande
   * @param status Le nouveau statut
   * @returns La demande mise à jour
   */
  async updateStatus(id: string, status: string) {
    try {
      // Vérifie si la demande existe
      const contactRequest = await this.prisma.contactRequest.findUnique({
        where: { id },
      });

      if (!contactRequest) {
        throw new NotFoundException(
          `Demande de contact avec l'ID ${id} non trouvée`,
        );
      }

      // Met à jour le statut
      const updatedContactRequest = await this.prisma.contactRequest.update({
        where: { id },
        data: {
          status: status as ContactRequestStatus,
        },
      });

      this.logger.log(
        `Statut de la demande de contact ${id} mis à jour: ${status}`,
      );

      return updatedContactRequest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la mise à jour du statut d'une demande de contact: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
