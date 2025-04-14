// nestjs
import { createZodDto } from 'nestjs-zod';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// auth
import { loginSchema } from 'src/auth/schemas/auth.schema';

export class LoginUserDto extends createZodDto(loginSchema) {
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
}
