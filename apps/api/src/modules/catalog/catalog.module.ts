import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { SecurityModule } from '../security/security.module';
import { UsersModule } from '../users/users.module';
import { CatalogPublicController, CatalogAdminController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { ImageObjectsService } from './images/image-objects.service';

@Module({
  imports: [PrismaModule, UsersModule, SecurityModule, StorageModule],
  controllers: [CatalogPublicController, CatalogAdminController],
  providers: [CatalogService, ImageObjectsService],
})
export class CatalogModule {}
