import { Module } from '@nestjs/common';
import { BorrowingsController } from './borrowings.controller';
import { BorrowingsService } from './borrowings.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BorrowingsController],
  providers: [BorrowingsService],
  exports: [BorrowingsService],
})
export class BorrowingsModule {}
