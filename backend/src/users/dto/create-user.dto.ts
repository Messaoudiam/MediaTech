// nestjs
import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { registerSchema } from '../../auth/schemas/auth.schema';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto extends createZodDto(registerSchema) {
  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  @Matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: "Format d'email invalide",
  })
  email: string;

  @ApiProperty({
    description: "Nom de famille de l'utilisateur",
    example: 'Dupont',
    required: true,
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      "Le nom ne peut contenir que des lettres, espaces, apostrophes et traits d'union",
  })
  nom: string;

  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'Jean',
    required: true,
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      "Le prénom ne peut contenir que des lettres, espaces, apostrophes et traits d'union",
  })
  prenom: string;

  @ApiProperty({
    description: "Mot de passe de l'utilisateur",
    example: 'Password123!',
    required: true,
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
    },
  )
  password: string;

  @ApiProperty({
    description: 'Confirmation du mot de passe',
    example: 'Password123!',
    required: true,
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
    },
  )
  confirmPassword: string;
}
