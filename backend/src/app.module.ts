// nestjs
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { envSchema, CONFIG } from './config/app.config';

// modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SupabaseModule } from './common/supabase.module';
import { StorageModule } from './common/storage.module';
import { ResourcesModule } from './resources/resources.module';
import { HealthModule } from './health/health.module';
import { BorrowingsModule } from './borrowings/borrowings.module';
import { CopiesModule } from './copies/copies.module';
import { ContactModule } from './modules/contact/contact.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    SupabaseModule,
    StorageModule,
    ResourcesModule,
    BorrowingsModule,
    CopiesModule,
    HealthModule,
    ContactModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
