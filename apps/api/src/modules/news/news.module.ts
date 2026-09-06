import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { SecurityModule } from '../security/security.module';
import { UsersModule } from '../users/users.module';
import { NewsAdminController, NewsPublicController } from './news.controller';
import { NewsService } from './news.service';
import { NewsCoverObjectsService } from './cover-objects.service';

@Module({
  imports: [PrismaModule, UsersModule, SecurityModule, StorageModule],
  controllers: [NewsPublicController, NewsAdminController],
  providers: [NewsService, NewsCoverObjectsService],
})
export class NewsModule {}
