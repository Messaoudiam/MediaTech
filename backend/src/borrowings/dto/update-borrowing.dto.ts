import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { BorrowingStatus } from '@prisma/client';

export class UpdateBorrowingDto {
  @ApiPropertyOptional({
    description: "Statut de l'emprunt",
    enum: BorrowingStatus,
    example: BorrowingStatus.RETURNED,
  })
  @IsEnum(BorrowingStatus)
  @IsOptional()
  status?: BorrowingStatus;

  @ApiPropertyOptional({
    description: "Date de retour de l'emprunt",
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  returnedAt?: string;

  @ApiPropertyOptional({
    description: 'Date prévue de retour (en cas de prolongation)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description: "Commentaires sur l'emprunt",
    example: 'Retour anticipé suite à une demande urgente',
  })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({
    description: "Indique si l'emprunt est renouvelé",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  renew?: boolean;
}
