import { queryInteger, trimmedQuery } from '../../common/dto/query.transforms';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  NotContains,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @NotContains('\0')
  @MaxLength(160)
  @Matches(/\S/)
  name!: string;
  @ApiProperty({ maxLength: 180 })
  @IsString()
  @NotContains('\0')
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$(?![\s\S])/)
  slug!: string;
  @ApiPropertyOptional({ nullable: true, type: String, description: 'Plain text' })
  @IsOptional()
  @IsString()
  @NotContains('\0')
  @MaxLength(100000)
  description?: string | null;
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    format: 'uuid',
    description: 'Existing immutable uploaded logo object',
  })
  @IsOptional()
  @IsUUID('4')
  logoKey?: string | null;
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uri' })
  @IsOptional()
  @IsString()
  @NotContains('\0')
  @MaxLength(2048)
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    require_valid_protocol: true,
    disallow_auth: true,
  })
  websiteUrl?: string | null;
  @ApiPropertyOptional({ default: true })
  @ValidateIf((_o, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
export class UpdateBrandDto extends PartialType(CreateBrandDto, { skipNullProperties: false }) {}
export class BrandQueryDto {
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
}
export class AdminBrandQueryDto extends BrandQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;
}
