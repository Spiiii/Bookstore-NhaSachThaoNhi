import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { NewsModule } from './modules/news/news.module';
import { BannersModule } from './modules/banners/banners.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';

/** Single runtime controller registry, reused by offline Swagger tooling. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, expandVariables: false }),
    HealthModule,
    AuthModule,
    CatalogModule,
    CategoriesModule,
    BrandsModule,
    NewsModule,
    BannersModule,
    UploadsModule,
  ],
})
export class AppModule {}
