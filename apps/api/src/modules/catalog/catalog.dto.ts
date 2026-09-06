import { queryInteger, trimmedQuery } from '../../common/dto/query.transforms';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  NotContains,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class ProductQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 10000 })
  @ValidateIf((_o, value) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => queryInteger(value))
  @IsInt()
  @Min(1)
  @Max(10000)
  page = 1;
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @ValidateIf((_o, value) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => queryInteger(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimmedQuery(value))
  @IsString()
  @NotContains('\0')
  @MaxLength(100)
  q?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID('4') categoryId?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID('4') brandId?: string;
}
export class AdminProductQueryDto extends ProductQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;
}
export class CreateProductDto {
  @ApiProperty({ maxLength: 64 })
  @IsString()
  @NotContains('\0')
  @MaxLength(64)
  @Matches(/^(?=\S)(?:.*\S)?$(?![\s\S])/)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  sku!: string;
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @NotContains('\0')
  @MaxLength(200)
  @Matches(/\S/)
  name!: string;
  @ApiProperty({ maxLength: 180 })
  @IsString()
  @NotContains('\0')
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$(?![\s\S])/)
  slug!: string;
  @ApiPropertyOptional({ nullable: true, type: String, maxLength: 500 })
  @IsOptional()
  @IsString()
  @NotContains('\0')
  @MaxLength(500)
  summary?: string | null;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Markdown; render with the approved safe renderer',
  })
  @IsOptional()
  @IsString()
  @NotContains('\0')
  @MaxLength(100000)
  description?: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' }) @IsOptional() @IsUUID('4') categoryId?:
    string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' }) @IsOptional() @IsUUID('4') brandId?:
    string | null;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Integer VND amount, at most 14 digits; null means contact for price',
  })
  @IsOptional()
  @IsString()
  @NotContains('\0')
  @Matches(/^(0|[1-9][0-9]{0,13})$(?![\s\S])/)
  referencePrice?: string | null;
}
export class UpdateProductDto extends PartialType(CreateProductDto, {
  skipNullProperties: false,
}) {}
export class PublicationDto {
  @ApiProperty() @IsBoolean() isActive!: boolean;
}
export class ImageMetadataDto {
  @ApiPropertyOptional({ nullable: true, type: String, maxLength: 250 })
  @IsOptional()
  @IsString()
  @NotContains('\0')
  @MaxLength(250)
  altText?: string | null;
  @ApiPropertyOptional({ minimum: 0 })
  @ValidateIf((_o, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sortOrder?: number;
  @ApiPropertyOptional()
  @ValidateIf((_o, value) => value !== undefined)
  @IsBoolean()
  isPrimary?: boolean;
}
export class AttachImageDto extends ImageMetadataDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Existing immutable Storage object key produced by upload',
  })
  @IsUUID('4')
  storageKey!: string;
}
export class AttributeDto {
  @ApiProperty()
  @IsString()
  @NotContains('\0')
  @MaxLength(80)
  @Matches(/^[a-z0-9][a-z0-9_-]*$(?![\s\S])/)
  key!: string;
  @ApiProperty() @IsString() @NotContains('\0') @MaxLength(120) @Matches(/\S/) label!: string;
  @ApiProperty() @IsString() @NotContains('\0') @MaxLength(1000) @Matches(/\S/) value!: string;
  @ApiPropertyOptional({ minimum: 0 })
  @ValidateIf((_o, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sortOrder?: number;
}
export class UpdateAttributeDto extends PartialType(AttributeDto, { skipNullProperties: false }) {}
export class MarketplaceLinkDto {
  @ApiProperty({ format: 'uri', maxLength: 2048 })
  @IsString()
  @NotContains('\0')
  @MaxLength(2048)
  url!: string;
  @ApiPropertyOptional()
  @ValidateIf((_o, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
