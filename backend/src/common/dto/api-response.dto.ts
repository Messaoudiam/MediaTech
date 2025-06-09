import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: "Identifiant unique de l'utilisateur",
    example: '60d5c8e742b1236b40b9f123',
  })
  id: string;

  @ApiProperty({
    description: "Email de l'utilisateur",
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: "Nom de famille de l'utilisateur",
    example: 'Dupont',
    required: true,
  })
  nom: string;

  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'Jean',
    required: true,
  })
  prenom: string;

  @ApiProperty({
    description: "Nom de famille de l'utilisateur (alias)",
    example: 'Dupont',
    required: false,
  })
  lastName?: string;

  @ApiProperty({
    description: "Prénom de l'utilisateur (alias)",
    example: 'Jean',
    required: false,
  })
  firstName?: string;

  @ApiProperty({
    description: "Rôle de l'utilisateur",
    example: 'USER',
    required: false,
  })
  role?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Message de succès',
    example: 'Connexion réussie',
  })
  message: string;

  @ApiProperty({
    description: "Informations de l'utilisateur connecté",
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({
    description: "Message de l'API",
    example: 'Opération réussie',
  })
  message: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: "Code d'erreur HTTP",
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: "Message d'erreur",
    example: 'Données invalides',
  })
  message: string;

  @ApiProperty({
    description: 'Chemin de la requête',
    example: '/api/auth/login',
  })
  path: string;

  @ApiProperty({
    description: "Date de l'erreur",
    example: '2023-07-21T15:21:22.123Z',
  })
  timestamp: string;
}
