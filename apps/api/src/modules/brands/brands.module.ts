import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { SecurityModule } from '../security/security.module';
import { UsersModule } from '../users/users.module';
import { BrandsAdminController, BrandsPublicController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandLogoObjectsService } from './logo-objects.service';

@Module({
  imports: [PrismaModule, UsersModule, SecurityModule, StorageModule],
  controllers: [BrandsPublicController, BrandsAdminController],
  providers: [BrandsService, BrandLogoObjectsService],
})
export class BrandsModule {}
