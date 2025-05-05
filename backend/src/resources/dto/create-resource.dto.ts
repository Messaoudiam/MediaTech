import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({
    description: 'Titre de la ressource',
    example: 'Le Seigneur des Anneaux',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Type de ressource',
    enum: ResourceType,
    example: ResourceType.BOOK,
  })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiPropertyOptional({
    description: 'Auteur de la ressource',
    example: 'J.R.R. Tolkien',
  })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiPropertyOptional({
    description: 'ISBN de la ressource',
    example: '9780261103252',
  })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiPropertyOptional({
    description: 'Éditeur de la ressource',
    example: 'Houghton Mifflin',
  })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiPropertyOptional({
    description: 'Date de publication',
    example: '1954-07-29T00:00:00.000Z',
  })
  @IsOptional()
  publishedAt?: Date;

  @ApiProperty({
    description: 'Description de la ressource',
    example: 'Un roman de fantasy épique...',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Genre de la ressource',
    example: 'Fantasy',
  })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional({
    description: 'Langue de la ressource',
    example: 'Français',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Année de publication', example: 1954 })
  @IsOptional()
  @IsPositive()
  publishedYear?: number;

  @ApiPropertyOptional({ description: 'Nombre de pages', example: 423 })
  @IsOptional()
  @IsPositive()
  pageCount?: number;
}
