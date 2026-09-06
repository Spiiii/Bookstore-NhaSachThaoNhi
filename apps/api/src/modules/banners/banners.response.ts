import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Banner } from '../../generated/prisma/client';

export class BannerResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty() altText!: string;
  @ApiProperty({ type: String, nullable: true }) targetUrl!: string | null;
  @ApiProperty() placement!: string;
  @ApiProperty() sortOrder!: number;
  @ApiPropertyOptional({ description: 'Admin only' }) title?: string;
  @ApiPropertyOptional({ description: 'Admin only' }) imageKey?: string;
  @ApiPropertyOptional({ description: 'Admin only' }) isActive?: boolean;
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Admin only; inclusive',
  })
  startAt?: Date | null;
  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Admin only; exclusive',
  })
  endAt?: Date | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Admin only' })
  createdAt?: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Admin only' })
  updatedAt?: Date;
}
export class BannerPageDto {
  @ApiProperty({ type: [BannerResponseDto] }) items!: BannerResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() hasMore!: boolean;
}
export function bannerResponse(row: Banner, admin: boolean): BannerResponseDto {
  return {
    id: row.id,
    imageUrl: (admin ? '/admin/banners/' : '/banners/') + row.id + '/image',
    altText: row.altText,
    targetUrl: row.targetUrl,
    placement: row.placement,
    sortOrder: row.sortOrder,
    ...(admin
      ? {
          title: row.title,
          imageKey: row.imageKey,
          isActive: row.isActive,
          startAt: row.startsAt,
          endAt: row.endsAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }
      : {}),
  };
}
