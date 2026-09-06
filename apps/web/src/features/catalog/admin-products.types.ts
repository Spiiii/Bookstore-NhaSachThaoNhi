import type { components } from '@bookstore/contracts';

export type AdminProduct = components['schemas']['ProductResponseDto'];
export type AdminProductPage = components['schemas']['ProductPageResponseDto'];
export type AttachProductImageInput = components['schemas']['AttachImageDto'];
export type ProductImageInput = components['schemas']['ImageMetadataDto'];
export type ProductAttributeInput = components['schemas']['AttributeDto'];
export type ProductAttributeUpdateInput = components['schemas']['UpdateAttributeDto'];
export type MarketplaceLinkInput = components['schemas']['MarketplaceLinkDto'];
export type Marketplace = 'SHOPEE' | 'TIKTOK_SHOP';

export interface AdminProductFilters {
  page: number;
  q?: string;
  isActive?: boolean;
}

export interface ProductWriteInput {
  sku: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  categoryId: string | null;
  brandId: string | null;
  referencePrice: string | null;
}

export interface ProductFormOptions {
  categories: Array<{ id: string; name: string; depth: number }>;
  brands: Array<{ id: string; name: string }>;
}
