import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../services/storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Télécharge une image vers Supabase' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérification du type de fichier (seulement images)
    if (!file.mimetype.includes('image')) {
      throw new BadRequestException('Seules les images sont acceptées');
    }

    const imageUrl = await this.storageService.uploadImage(file.buffer);
    if (!imageUrl) {
      throw new BadRequestException("Échec du téléchargement de l'image");
    }

    return { url: imageUrl };
  }

  @Delete(':path')
  @ApiOperation({ summary: 'Supprime une image de Supabase' })
  async deleteImage(@Param('path') path: string) {
    if (!path) {
      throw new BadRequestException("Chemin d'image invalide");
    }

    const success = await this.storageService.deleteImage(path);
    if (!success) {
      throw new NotFoundException(
        'Image non trouvée ou impossible à supprimer',
      );
    }

    return { message: 'Image supprimée avec succès' };
  }
}
