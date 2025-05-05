import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CopiesController } from './copies.controller';
import { CopiesService } from './copies.service';

@Module({
  controllers: [CopiesController],
  providers: [CopiesService, PrismaService],
  exports: [CopiesService],
})
export class CopiesModule {}
