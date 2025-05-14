import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AdminCreateBorrowingDto {
  @ApiProperty({
    description: "ID de l'exemplaire à emprunter",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  copyId: string;

  @ApiProperty({
    description: "ID de l'utilisateur pour lequel créer l'emprunt",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description:
      'Date prévue de retour (facultatif, calculée automatiquement si non fournie)',
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description: "Commentaires sur l'emprunt",
    example: 'Emprunt attribué par administrateur',
  })
  @IsString()
  @IsOptional()
  comments?: string;
}
