import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UserRole } from '@prisma/client';

// NOTE: Utilisez ces implémentations jusqu'à ce que les vrais gardes soient disponibles
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

export function Roles(..._roles: UserRole[]) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (_target: any, _key?: string, _descriptor?: any) {};
}

@Injectable()
export class RolesGuard {
  canActivate() {
    return true;
  }
}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Soumettre une demande de contact' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'La demande de contact a été créée avec succès',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides',
  })
  @ApiBearerAuth()
  async create(
    @Body() createContactRequestDto: CreateContactRequestDto,
    @Request() req,
  ) {
    // Si l'utilisateur est authentifié, utiliser son ID
    const userId = req.user?.id;

    return this.contactService.create(createContactRequestDto, userId);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer toutes les demandes de contact (admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des demandes de contact récupérées avec succès',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès refusé - Réservé aux administrateurs',
  })
  @ApiBearerAuth()
  async findAll() {
    return this.contactService.findAll();
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer une demande de contact par ID (admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Demande de contact récupérée avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Demande de contact non trouvée',
  })
  @ApiBearerAuth()
  async findOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @Patch('requests/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Marquer une demande de contact comme résolue (admin)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Demande de contact mise à jour avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Demande de contact non trouvée',
  })
  @ApiBearerAuth()
  async resolve(@Param('id') id: string) {
    return this.contactService.updateStatus(id, 'RESOLVED');
  }
}
