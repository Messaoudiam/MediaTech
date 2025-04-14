import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Accueil')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: "Page d'accueil",
    description: 'Retourne un message de bienvenue',
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
