import { ConfigModule } from '@nestjs/config';
import { BannerPolicy } from './banner.policy';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { SecurityModule } from '../security/security.module';
import { UsersModule } from '../users/users.module';
import { BannersAdminController, BannersPublicController } from './banners.controller';
import { BannersService } from './banners.service';
import { BannerImageObjectsService } from './image-objects.service';

@Module({
  imports: [ConfigModule, PrismaModule, UsersModule, SecurityModule, StorageModule],
  controllers: [BannersPublicController, BannersAdminController],
  providers: [BannerPolicy, BannersService, BannerImageObjectsService],
})
export class BannersModule {}
