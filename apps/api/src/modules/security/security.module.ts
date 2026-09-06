import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtPolicy } from './services/jwt-policy.service';
import { SecurityTokenService } from './services/security-token.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'jwt-access', session: false }),
    UsersModule,
  ],
  providers: [
    JwtPolicy,
    SecurityTokenService,
    AccessTokenStrategy,
    JwtAccessGuard,
    RolesGuard,
    { provide: APP_GUARD, useExisting: JwtAccessGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],
  exports: [SecurityTokenService, JwtAccessGuard, RolesGuard],
})
export class SecurityModule {}
