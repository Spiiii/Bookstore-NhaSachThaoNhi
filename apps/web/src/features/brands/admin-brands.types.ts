import type { components } from '@bookstore/contracts';

export type AdminBrand = components['schemas']['BrandResponseDto'];
export type AdminBrandPage = components['schemas']['BrandPageDto'];
export type BrandWriteInput = components['schemas']['CreateBrandDto'];
export type BrandUpdateInput = components['schemas']['UpdateBrandDto'];
export interface AdminBrandFilters {
  page: number;
  q?: string;
  isActive?: boolean;
}
