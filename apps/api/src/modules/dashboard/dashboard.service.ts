import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { DashboardResponseDto } from './dashboard.response';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<DashboardResponseDto> {
    const [
      products,
      activeProducts,
      productsMissingImages,
      categories,
      activeCategories,
      brands,
      activeBrands,
      news,
      publishedNews,
      draftNews,
      archivedNews,
      banners,
      activeBanners,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { images: { none: {} } } }),
      this.prisma.category.count(),
      this.prisma.category.count({ where: { isActive: true } }),
      this.prisma.brand.count(),
      this.prisma.brand.count({ where: { isActive: true } }),
      this.prisma.news.count(),
      this.prisma.news.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.news.count({ where: { status: 'DRAFT' } }),
      this.prisma.news.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.banner.count(),
      this.prisma.banner.count({ where: { isActive: true } }),
    ]);

    return {
      products: { total: products, active: activeProducts, missingImages: productsMissingImages },
      categories: { total: categories, active: activeCategories },
      brands: { total: brands, active: activeBrands },
      news: { total: news, published: publishedNews, draft: draftNews, archived: archivedNews },
      banners: { total: banners, active: activeBanners },
      generatedAt: new Date().toISOString(),
    };
  }
}
