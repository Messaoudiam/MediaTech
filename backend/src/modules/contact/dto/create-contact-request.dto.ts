import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactRequestDto {
  @ApiProperty({
    description: 'Nom de la personne qui soumet la demande',
    example: 'Jean Dupont',
  })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le nom ne doit pas dépasser 100 caractères' })
  name: string;

  @ApiProperty({
    description: 'Email de la personne qui soumet la demande',
    example: 'jean.dupont@example.com',
  })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  @IsEmail({}, { message: "L'email doit être valide" })
  @MaxLength(100, { message: "L'email ne doit pas dépasser 100 caractères" })
  email: string;

  @ApiProperty({
    description: 'Sujet de la demande',
    example: "Question sur les horaires d'ouverture",
  })
  @IsNotEmpty({ message: 'Le sujet est obligatoire' })
  @IsString({ message: 'Le sujet doit être une chaîne de caractères' })
  @MaxLength(200, { message: 'Le sujet ne doit pas dépasser 200 caractères' })
  subject: string;

  @ApiProperty({
    description: 'Message détaillé de la demande',
    example:
      "Bonjour, pourriez-vous me confirmer les horaires d'ouverture pour le jour férié du 14 juillet ? Merci d'avance.",
  })
  @IsNotEmpty({ message: 'Le message est obligatoire' })
  @IsString({ message: 'Le message doit être une chaîne de caractères' })
  @MinLength(10, { message: 'Le message doit contenir au moins 10 caractères' })
  @MaxLength(2000, {
    message: 'Le message ne doit pas dépasser 2000 caractères',
  })
  message: string;
}
