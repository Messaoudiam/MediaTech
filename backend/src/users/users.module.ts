// nestjs
import { Module } from '@nestjs/common';

// services
import { UsersService } from './users.service';

// controllers
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
