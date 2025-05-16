import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import { CopiesService } from './copies.service';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateCopyDto } from './dto/create-copy.dto';
import { UpdateCopyDto } from './dto/update-copy.dto';

@ApiTags('copies')
@Controller('copies')
export class CopiesController {
  private readonly logger = new Logger(CopiesController.name);

  constructor(private readonly copiesService: CopiesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel exemplaire' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBody({ type: CreateCopyDto })
  async create(@Body() createCopyDto: CreateCopyDto) {
    this.logger.log(
      `Création d'un exemplaire pour la ressource: ${createCopyDto.resourceId}`,
    );
    return this.copiesService.create(createCopyDto);
  }

  @Get('resource/:resourceId')
  @ApiOperation({ summary: "Récupérer tous les exemplaires d'une ressource" })
  @ApiParam({ name: 'resourceId', type: String })
  async findByResourceId(@Param('resourceId') resourceId: string) {
    this.logger.log(
      `Récupération des exemplaires de la ressource ${resourceId}`,
    );
    return this.copiesService.findAll(resourceId);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les exemplaires ou filtrer par ressource',
    description:
      'Permet de récupérer tous les exemplaires avec possibilité de filtrer par ressource ou disponibilité',
  })
  @ApiQuery({
    name: 'resourceId',
    required: false,
    description: 'ID de la ressource pour filtrer les exemplaires',
  })
  @ApiQuery({
    name: 'available',
    required: false,
    type: Boolean,
    description: 'Filtre pour les exemplaires disponibles/non disponibles',
  })
  async findAll(
    @Query('resourceId') resourceId?: string,
    @Query('available') availableParam?: string,
  ) {
    // Conversion explicite du paramètre available en boolean
    let available: boolean | undefined = undefined;

    if (availableParam !== undefined) {
      // Convertir de façon plus robuste
      available = availableParam === 'true' || availableParam === '1';
      this.logger.log(
        `Paramètre available reçu: "${availableParam}", converti en: ${available}`,
      );
    }

    this.logger.log(
      `Récupération des exemplaires - ResourceId: ${resourceId}, Available: ${available}`,
    );

    const copies = await this.copiesService.findAll(resourceId, available);
    this.logger.log(`Nombre d'exemplaires trouvés: ${copies.length}`);

    // Log détaillé du résultat
    if (copies.length > 0) {
      this.logger.debug(`Premier exemplaire: ${JSON.stringify(copies[0])}`);
    }

    return copies;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un exemplaire par son ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string) {
    this.logger.log(`Récupération de l'exemplaire ${id}`);
    return this.copiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un exemplaire' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateCopyDto })
  async update(@Param('id') id: string, @Body() updateCopyDto: UpdateCopyDto) {
    this.logger.log(`Mise à jour de l'exemplaire ${id}`);
    return this.copiesService.update(id, updateCopyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un exemplaire' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string) {
    this.logger.log(`Suppression de l'exemplaire ${id}`);
    return this.copiesService.remove(id);
  }
}
