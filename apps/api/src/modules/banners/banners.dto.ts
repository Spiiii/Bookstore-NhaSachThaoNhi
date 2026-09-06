import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  NotContains,
  ValidateIf,
} from 'class-validator';
import { queryInteger, trimmedQuery } from '../../common/dto/query.transforms';

export class CreateBannerDto {
  @ApiProperty({ maxLength: 160, description: 'Internal label' })
  @IsString()
  @NotContains('\0')
  @MaxLength(160)
  @Matches(/\S/)
  title!: string;
  @ApiProperty({ format: 'uuid', description: 'Existing immutable uploaded image' })
  @IsUUID('4')
  imageKey!: string;
  @ApiProperty({ maxLength: 250, description: 'Empty for decorative images' })
  @IsString()
  @NotContains('\0')
  @MaxLength(250)
  altText!: string;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 2048,
    description: 'Site-root-relative path or HTTPS URL',
  })
  @IsOptional()
  @IsString()
  @NotContains('\0')
  @MaxLength(2048)
  targetUrl?: string | null;
  @ApiProperty({
    maxLength: 64,
    example: 'home-hero',
    description: 'Configured placement allowlist',
  })
  @IsString()
  @NotContains('\0')
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$(?![\s\S])/)
  placement!: string;
  @ApiPropertyOptional({ default: 0, minimum: 0, maximum: 2147483647 })
  @ValidateIf((_o, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sortOrder?: number;
  @ApiPropertyOptional({ default: false })
  @ValidateIf((_o, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    format: 'date-time',
    description: 'Inclusive start, timezone required; maps to Banner.startsAt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(35)
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$(?![\s\S])/)
  startAt?: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    format: 'date-time',
    description: 'Exclusive end, timezone required; maps to Banner.endsAt',
  })
  @IsOptional()
  @IsString()
  @MaxLength(35)
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$(?![\s\S])/)
  endAt?: string | null;
}
export class UpdateBannerDto extends PartialType(CreateBannerDto, { skipNullProperties: false }) {}

export class BannerQueryDto {
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
  @ApiPropertyOptional({ example: 'home-hero' })
  @ValidateIf((_o, value) => value !== undefined)
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$(?![\s\S])/)
  placement?: string;
}
export class AdminBannerQueryDto extends BannerQueryDto {
  @ApiPropertyOptional()
  @ValidateIf((_o, value) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional({ maxLength: 100, description: 'Internal title substring' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimmedQuery(value))
  @IsString()
  @NotContains('\0')
  @MaxLength(100)
  q?: string;
}
