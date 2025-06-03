// nestjs
import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// services
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';

// modules
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../modules/email/email.module';
import { Env } from '../config/app.config';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<Env>) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION', {
            infer: true,
          }),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  private readonly logger = new Logger(AuthModule.name);

  onModuleInit() {
    this.logger.log('AuthModule initialisé');
  }
}
