import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BorrowingStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class QueryBorrowingDto {
  @ApiPropertyOptional({
    description: "ID de l'utilisateur",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'ID de la ressource',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({
    description: "Statut de l'emprunt",
    enum: BorrowingStatus,
    example: BorrowingStatus.ACTIVE,
  })
  @IsEnum(BorrowingStatus)
  @IsOptional()
  status?: BorrowingStatus;

  @ApiPropertyOptional({
    description: 'Inclure les détails de la ressource',
    example: 'true',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeResource?: boolean;

  @ApiPropertyOptional({
    description: "Inclure les détails de l'utilisateur",
    example: 'true',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeUser?: boolean;

  @ApiPropertyOptional({
    description: "Nombre d'éléments à ignorer (pagination)",
    example: '0',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  skip?: number;

  @ApiPropertyOptional({
    description: "Nombre d'éléments à retourner (pagination)",
    example: '10',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  take?: number;

  @ApiPropertyOptional({
    description: 'Recherche textuelle',
    example: 'science-fiction',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
