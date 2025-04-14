// nestjs
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: "Rôle de l'utilisateur",
    enum: UserRole,
    example: 'ADMIN',
    required: true,
  })
  @IsEnum(UserRole, {
    message: 'Le rôle doit être USER ou ADMIN',
  })
  role: UserRole;
}
