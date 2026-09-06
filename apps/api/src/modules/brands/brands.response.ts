import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Brand } from '../../generated/prisma/client';

export class BrandResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ nullable: true, type: String }) description!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'uri' }) websiteUrl!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'API-relative logo route; resolve with the API mount prefix',
  })
  logoUrl!: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, description: 'Admin only' }) logoKey?:
    string | null;
  @ApiPropertyOptional({ description: 'Admin only' }) isActive?: boolean;
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Admin only' })
  createdAt?: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Admin only' })
  updatedAt?: Date;
}
export class BrandPageDto {
  @ApiProperty({ type: [BrandResponseDto] }) items!: BrandResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() hasMore!: boolean;
}
export function brandResponse(row: Brand, admin: boolean): BrandResponseDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    websiteUrl: row.websiteUrl,
    logoUrl: row.logoKey
      ? admin
        ? '/admin/brands/' + row.id + '/logo'
        : '/brands/by-slug/' + row.slug + '/logo'
      : null,
    ...(admin
      ? {
          logoKey: row.logoKey,
          isActive: row.isActive,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }
      : {}),
  };
}
