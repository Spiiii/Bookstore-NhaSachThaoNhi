import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PasswordModule } from '../../infrastructure/credentials/password.module';
import { SecurityModule } from '../security/security.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthHttpPolicy } from './auth-http.policy';
import { AuthRequestGuard } from './auth-request.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [ConfigModule, UsersModule, SecurityModule, PasswordModule],
  controllers: [AuthController],
  providers: [AuthService, AuthHttpPolicy, AuthRequestGuard],
})
export class AuthModule {}
