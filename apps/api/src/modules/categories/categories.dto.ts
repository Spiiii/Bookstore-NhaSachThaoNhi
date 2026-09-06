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

export class CreateCategoryDto {
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
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @ValidateIf((_o, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sortOrder?: number;
  @ApiPropertyOptional({ default: true })
  @ValidateIf((_o, value) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
export class UpdateCategoryDto extends PartialType(CreateCategoryDto, {
  skipNullProperties: false,
}) {}
export class CategoryQueryDto {
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
  @ApiPropertyOptional({ format: 'uuid', description: 'Stored direct parent ID' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
export class AdminCategoryQueryDto extends CategoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;
}
export class CategoryTreeQueryDto {}
