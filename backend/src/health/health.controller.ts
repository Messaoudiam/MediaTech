import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthResponseDto,
  HealthErrorResponseDto,
} from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les informations de santé du serveur' })
  @ApiResponse({
    status: 200,
    description: 'Informations de santé récupérées avec succès',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur lors de la récupération des informations de santé',
    type: HealthErrorResponseDto,
  })
  async getHealth() {
    return this.healthService.getHealthInfo();
  }
}
