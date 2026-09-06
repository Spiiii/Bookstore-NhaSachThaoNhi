import type { components } from '@bookstore/contracts';

export type AdminNews = components['schemas']['NewsResponseDto'];
export type NewsWriteInput = components['schemas']['CreateNewsDto'];
export type NewsUpdateInput = components['schemas']['UpdateNewsDto'];
export type NewsPublicationInput = components['schemas']['NewsPublicationDto'];
export type NewsStatus = components['schemas']['NewsPublicationDto']['status'];

export interface AdminNewsFilters {
  page: number;
  q?: string;
  status?: NewsStatus;
}
