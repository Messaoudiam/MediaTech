// nestjs
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { envSchema, CONFIG } from './config/app.config';

// modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
    ThrottlerModule.forRoot([CONFIG.api.throttle]),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
