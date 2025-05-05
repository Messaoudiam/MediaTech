import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Express } from 'express';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle ressource' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ...Object.fromEntries(
          Object.entries(new CreateResourceDto()).map(([key]) => [
            key,
            { type: 'string' },
          ]),
        ),
        coverImage: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async create(
    @Body() createResourceDto: CreateResourceDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    if (coverImage) {
    }

    return this.resourcesService.create(
      createResourceDto,
      coverImage?.buffer,
      coverImage?.mimetype,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les ressources' })
  async findAll(
    @Query('type') type?: string,
    @Query('author') author?: string,
    @Query('genre') genre?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (author) {
      where.author = { contains: author, mode: 'insensitive' };
    }

    if (genre) {
      where.genre = { contains: genre, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.resourcesService.findAll({
      where,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      orderBy: { title: 'asc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une ressource par son ID' })
  async findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une ressource' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    if (coverImage) {
    }

    try {
      // Déterminer si nous devons supprimer l'image
      const shouldRemoveCoverImage =
        updateResourceDto.removeCoverImage === 'true';

      // Créer une copie du DTO sans la propriété removeCoverImage
      const { removeCoverImage, ...updatedData } = updateResourceDto;

      // console.log(
      //   "DEBUG: Suppression d'image demandée:",
      //   shouldRemoveCoverImage,
      // );

      return this.resourcesService.update(
        id,
        updatedData,
        coverImage?.buffer,
        coverImage?.mimetype,
        shouldRemoveCoverImage,
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une ressource' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.resourcesService.remove(id);
  }

  // Méthodes pour les favoris
  @Post(':id/favorite')
  @ApiOperation({ summary: 'Ajouter une ressource aux favoris' })
  @UseGuards(JwtAuthGuard)
  async addToFavorites(@Request() req, @Param('id') resourceId: string) {
    await this.resourcesService.addToFavorites(req.user.id, resourceId);
    return { message: 'Ressource ajoutée aux favoris' };
  }

  @Delete(':id/favorite')
  @ApiOperation({ summary: 'Retirer une ressource des favoris' })
  @UseGuards(JwtAuthGuard)
  async removeFromFavorites(@Request() req, @Param('id') resourceId: string) {
    await this.resourcesService.removeFromFavorites(req.user.id, resourceId);
    return { message: 'Ressource retirée des favoris' };
  }

  @Get('user/favorites')
  @ApiOperation({
    summary: "Récupérer les ressources favorites de l'utilisateur",
  })
  @UseGuards(JwtAuthGuard)
  async getFavorites(@Request() req) {
    return this.resourcesService.getFavorites(req.user.id);
  }
}
