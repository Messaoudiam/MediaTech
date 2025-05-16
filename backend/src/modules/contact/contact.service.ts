import { Injectable, Logger } from '@nestjs/common';
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
}
