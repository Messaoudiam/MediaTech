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
  ParseBoolPipe,
  Optional,
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

  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les exemplaires ou filtrer par ressource',
  })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  async findAll(
    @Query('resourceId') resourceId?: string,
    @Query('available', { transform: (value) => value === 'true' })
    available?: boolean,
  ) {
    this.logger.log(
      `Récupération des exemplaires - ResourceId: ${resourceId}, Available: ${available}`,
    );
    return this.copiesService.findAll(resourceId, available);
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

  @Get('resource/:resourceId')
  @ApiOperation({ summary: "Récupérer tous les exemplaires d'une ressource" })
  @ApiParam({ name: 'resourceId', type: String })
  async findByResourceId(@Param('resourceId') resourceId: string) {
    this.logger.log(
      `Récupération des exemplaires de la ressource ${resourceId}`,
    );
    return this.copiesService.findAll(resourceId);
  }
}
