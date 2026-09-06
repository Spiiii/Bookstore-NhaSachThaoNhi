import type { components } from '@bookstore/contracts';

export type AdminBanner = components['schemas']['BannerResponseDto'];
export type BannerWriteInput = components['schemas']['CreateBannerDto'];
export type BannerUpdateInput = components['schemas']['UpdateBannerDto'];

export interface AdminBannerFilters {
  page: number;
  q?: string;
  placement?: string;
  isActive?: boolean;
}
