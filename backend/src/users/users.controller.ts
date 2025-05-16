// nestjs
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

// services
import { UsersService } from './users.service';

// dtos
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import {
  UserResponseDto,
  ErrorResponseDto,
} from '../common/dto/api-response.dto';

// guards & decorators
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Utilisateurs')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Créer un utilisateur',
    description: 'Crée un nouvel utilisateur dans le système',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé.',
    type: ErrorResponseDto,
  })
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @ApiOperation({
    summary: 'Liste des utilisateurs',
    description:
      'Récupère la liste de tous les utilisateurs (admin uniquement)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs récupérée avec succès.',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé.',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll() {
    return this.usersService.findAllUsers();
  }

  @ApiOperation({
    summary: "Modifier le rôle d'un utilisateur",
    description: "Modifie le rôle d'un utilisateur (admin uniquement)",
  })
  @ApiParam({ name: 'id', description: "ID de l'utilisateur" })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({
    status: 200,
    description: "Rôle de l'utilisateur modifié avec succès.",
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé.',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(id, updateRoleDto.role);
  }

  @ApiOperation({
    summary: "Nombre total d'utilisateurs",
    description:
      "Récupère le nombre total d'utilisateurs dans le système (admin uniquement)",
  })
  @ApiResponse({
    status: 200,
    description: "Nombre d'utilisateurs récupéré avec succès.",
    type: Number,
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé.',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('count')
  async getUserCount(): Promise<number> {
    return this.usersService.countUsers();
  }
}
