import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewsStatus, type News, type Prisma } from '../../generated/prisma/client';

export const NEWS_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverKey: true,
  status: true,
  publishedAt: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NewsSelect;
type NewsListRow = Prisma.NewsGetPayload<{ select: typeof NEWS_LIST_SELECT }>;

export class NewsSeoDto {
  @ApiProperty() title!: string;
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({
    description: 'Website-relative path; resolve against configured canonical website origin',
  })
  canonicalPath!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'API-relative cover URL; admin preview requires Bearer authentication',
  })
  imageUrl!: string | null;
  @ApiProperty({ enum: ['article'] }) type!: 'article';
  @ApiProperty() noIndex!: boolean;
}

export class NewsResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ type: String, nullable: true }) excerpt!: string | null;
  @ApiPropertyOptional({ description: 'Markdown source, detail responses only' }) content?: string;
  @ApiProperty({ type: String, nullable: true }) coverUrl!: string | null;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) publishedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
  @ApiProperty({ type: NewsSeoDto }) seo!: NewsSeoDto;
  @ApiPropertyOptional({ enum: NewsStatus, description: 'Admin only' }) status?: NewsStatus;
  @ApiPropertyOptional({ format: 'uuid', description: 'Admin only' }) authorId?: string;
  @ApiPropertyOptional({ type: String, nullable: true, description: 'Admin only' }) coverKey?:
    string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Admin only' })
  createdAt?: Date;
}
export class NewsPageDto {
  @ApiProperty({ type: [NewsResponseDto] }) items!: NewsResponseDto[];
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() hasMore!: boolean;
}

export function newsResponse(row: News | NewsListRow, admin: boolean): NewsResponseDto {
  const coverUrl = row.coverKey
    ? admin
      ? '/admin/news/' + row.id + '/cover'
      : '/news/by-slug/' + row.slug + '/cover'
    : null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    ...('content' in row ? { content: row.content } : {}),
    coverUrl,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    seo: {
      title: row.title,
      description: row.excerpt?.trim() || null,
      canonicalPath: '/news/' + row.slug,
      imageUrl: coverUrl,
      type: 'article',
      noIndex: admin,
    },
    ...(admin
      ? {
          status: row.status,
          authorId: row.authorId,
          coverKey: row.coverKey,
          createdAt: row.createdAt,
        }
      : {}),
  };
}
