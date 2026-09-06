import { Module, type DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PasswordModule } from '../src/infrastructure/credentials/password.module';
import { PrismaModule } from '../src/infrastructure/prisma/prisma.module';
import { UsersModule } from '../src/modules/users/users.module';
import {
  REGISTER_PRISMA_RESOURCE,
  type RegisterPrismaResource,
} from '../src/infrastructure/prisma/prisma.service';

/** Standalone context only. No HTTP server, controllers, Auth, Security or runtime bootstrap. */
@Module({
  imports: [ConfigModule, PrismaModule, PasswordModule, UsersModule],
})
export class OperationalModule {
  static withResources(register: RegisterPrismaResource): DynamicModule {
    return {
      module: OperationalModule,
      global: true,
      providers: [{ provide: REGISTER_PRISMA_RESOURCE, useValue: register }],
      exports: [REGISTER_PRISMA_RESOURCE],
    };
  }
}
