import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
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
}
