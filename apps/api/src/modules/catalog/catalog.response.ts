import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Marketplace } from '../../generated/prisma/client';

export class ProductImageResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ nullable: true, type: String }) altText!: string | null;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() isPrimary!: boolean;
  @ApiProperty({ description: 'API-relative URL; apply the configured API mount prefix' })
  url!: string;
  @ApiPropertyOptional({ description: 'Admin responses only' }) storageKey?: string;
}
export class ProductAttributeResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() key!: string;
  @ApiProperty() label!: string;
  @ApiProperty() value!: string;
  @ApiProperty() sortOrder!: number;
}
export class MarketplaceButtonResponseDto {
  @ApiProperty({ enum: Marketplace }) marketplace!: Marketplace;
  @ApiProperty({ nullable: true, type: String }) url!: string | null;
  @ApiProperty() available!: boolean;
  @ApiProperty({ nullable: true, type: String }) message!: string | null;
}
export class MarketplaceLinkResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) productId!: string;
  @ApiProperty({ enum: Marketplace }) marketplace!: Marketplace;
  @ApiProperty() url!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
}
export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ nullable: true, type: String }) summary!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' }) categoryId!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' }) brandId!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Integer VND string; null means contact for price',
  })
  referencePrice!: string | null;
  @ApiProperty({ enum: ['VND'] }) currency!: string;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Markdown; detail responses only',
  })
  description?: string | null;
  @ApiProperty({ type: [ProductImageResponseDto] }) images!: ProductImageResponseDto[];
  @ApiPropertyOptional({
    type: [ProductAttributeResponseDto],
    description: 'Detail responses only',
  })
  attributes?: ProductAttributeResponseDto[];
  @ApiProperty({ type: [MarketplaceButtonResponseDto] })
  marketplaces!: MarketplaceButtonResponseDto[];
  @ApiPropertyOptional({ description: 'Admin only' }) isActive?: boolean;
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Admin only' })
  createdAt?: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Admin only' })
  updatedAt?: Date;
  @ApiPropertyOptional({
    type: [MarketplaceLinkResponseDto],
    description: 'Admin only; includes inactive links',
  })
  marketplaceLinks?: MarketplaceLinkResponseDto[];
}
export class ProductPageResponseDto {
  @ApiProperty({ type: [ProductResponseDto] }) items!: ProductResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() hasMore!: boolean;
}
