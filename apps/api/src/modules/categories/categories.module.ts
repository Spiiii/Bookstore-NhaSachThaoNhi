import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { UsersModule } from '../users/users.module';
import { CategoriesAdminController, CategoriesPublicController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [PrismaModule, UsersModule, SecurityModule],
  controllers: [CategoriesPublicController, CategoriesAdminController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
