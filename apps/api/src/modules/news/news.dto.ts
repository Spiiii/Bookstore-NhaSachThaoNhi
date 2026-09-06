import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsInt,
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
import { NewsStatus } from '../../generated/prisma/client';

export class CreateNewsDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @NotContains('\0')
  @MaxLength(200)
  @Matches(/\S/)
  title!: string;

  @ApiProperty({ maxLength: 180 })
  @IsString()
  @NotContains('\0')
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$(?![\s\S])/)
  slug!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 500,
    description: 'Plain text summary and SEO description',
  })
  @IsOptional()
  @IsString()
  @NotContains('\0')
  @MaxLength(500)
  excerpt?: string | null;

  @ApiProperty({ description: 'Markdown source; never rendered HTML', maxLength: 100000 })
  @IsString()
  @NotContains('\0')
  @MaxLength(100000)
  @Matches(/\S/)
  content!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    format: 'uuid',
    description: 'Existing immutable uploaded cover object',
  })
  @IsOptional()
  @IsUUID('4')
  coverKey?: string | null;
}

export class UpdateNewsDto extends PartialType(CreateNewsDto, { skipNullProperties: false }) {}

export class NewsPublicationDto {
  @ApiProperty({ enum: NewsStatus })
  @IsEnum(NewsStatus)
  status!: NewsStatus;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description:
      'PUBLISHED only: explicit time with timezone, or server time when publishing. Future dates schedule visibility.',
  })
  @ValidateIf((_o, value) => value !== undefined)
  @IsString()
  @NotContains('\0')
  @MaxLength(35)
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$(?![\s\S])/)
  publishedAt?: string;
}

export class NewsQueryDto {
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

  @ApiPropertyOptional({ maxLength: 100, description: 'Literal title substring' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimmedQuery(value))
  @IsString()
  @NotContains('\0')
  @MaxLength(100)
  q?: string;
}

export class AdminNewsQueryDto extends NewsQueryDto {
  @ApiPropertyOptional({ enum: NewsStatus })
  @ValidateIf((_o, value) => value !== undefined)
  @IsEnum(NewsStatus)
  status?: NewsStatus;
}
