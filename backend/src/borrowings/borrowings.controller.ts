import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BorrowingsService } from './borrowings.service';
import {
  CreateBorrowingDto,
  UpdateBorrowingDto,
  QueryBorrowingDto,
  AdminCreateBorrowingDto,
} from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('borrowings')
@Controller('borrowings')
@ApiBearerAuth()
export class BorrowingsController {
  constructor(private readonly borrowingsService: BorrowingsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel emprunt' })
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateBorrowingDto })
  async create(@Request() req, @Body() createBorrowingDto: CreateBorrowingDto) {
    return this.borrowingsService.create(req.user.id, createBorrowingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les emprunts' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Query() queryDto: QueryBorrowingDto) {
    const enhancedQuery = {
      ...queryDto,
      includeUser: true,
      includeResource: true,
    };
    return this.borrowingsService.findAll(enhancedQuery);
  }

  @Get('my')
  @ApiOperation({ summary: 'Récupérer mes emprunts' })
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'RETURNED', 'OVERDUE'],
  })
  async findUserBorrowings(
    @Request() req,
    @Query('status') status?: 'ACTIVE' | 'RETURNED' | 'OVERDUE',
  ) {
    return this.borrowingsService.findUserBorrowings(req.user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un emprunt par son ID' })
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: "ID de l'emprunt" })
  @ApiQuery({
    name: 'includeResource',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeUser',
    required: false,
    type: Boolean,
  })
  async findOne(
    @Param('id') id: string,
    @Query('includeResource') includeResource?: boolean,
    @Query('includeUser') includeUser?: boolean,
  ) {
    return this.borrowingsService.findOne(
      id,
      includeResource !== false,
      includeUser === true,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un emprunt' })
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: "ID de l'emprunt" })
  @ApiBody({ type: UpdateBorrowingDto })
  async update(
    @Param('id') id: string,
    @Body() updateBorrowingDto: UpdateBorrowingDto,
    @Request() req,
  ) {
    return this.borrowingsService.update(id, updateBorrowingDto, req.user);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Retourner un emprunt' })
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: "ID de l'emprunt" })
  async returnBorrowing(@Param('id') id: string, @Request() req) {
    return this.borrowingsService.returnBorrowing(id, req.user);
  }

  @Post('check-overdue')
  @ApiOperation({ summary: 'Vérifier les emprunts en retard' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async checkOverdueBorrowings() {
    return this.borrowingsService.checkOverdueBorrowings();
  }

  @Post('admin/create')
  @ApiOperation({ summary: 'Créer un emprunt pour un utilisateur (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBody({ type: AdminCreateBorrowingDto })
  async createByAdmin(
    @Body() adminCreateBorrowingDto: AdminCreateBorrowingDto,
  ) {
    return this.borrowingsService.createByAdmin(adminCreateBorrowingDto);
  }
}
