import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentAdmin } from '../security/decorators/current-admin.decorator';
import { Public } from '../security/decorators/public.decorator';
import { Roles } from '../security/decorators/roles.decorator';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import {
  AdminNewsQueryDto,
  NewsQueryDto,
  CreateNewsDto,
  UpdateNewsDto,
  NewsPublicationDto,
} from './news.dto';
import { NewsPageDto, NewsResponseDto } from './news.response';
import { NewsService } from './news.service';

const validation = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  validationError: { target: false, value: false },
});
const uuid = new ParseUUIDPipe({ version: '4' });
@ApiTags('news')
@Public()
@Controller('news')
@UsePipes(validation)
export class NewsPublicController {
  constructor(private readonly news: NewsService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: NewsPageDto })
  list(@Query() query: NewsQueryDto) {
    return this.news.list(query, false);
  }
  @Get('by-slug/:slug')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: NewsResponseDto })
  detail(@Param('slug') slug: string) {
    return this.news.detail(slug, false);
  }
  @Get('by-slug/:slug/cover')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'no-store')
  async cover(@Param('slug') slug: string, @Res({ passthrough: true }) response: Response) {
    const cover = await this.news.cover(slug, false);
    response.type(cover.mime);
    return new StreamableFile(cover.bytes, { type: cover.mime, disposition: 'inline' });
  }
}
@ApiTags('admin-news')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/news')
@UsePipes(validation)
export class NewsAdminController {
  constructor(private readonly news: NewsService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: NewsPageDto })
  list(@Query() query: AdminNewsQueryDto) {
    return this.news.list(query, true);
  }
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: NewsResponseDto })
  detail(@Param('id', uuid) id: string) {
    return this.news.detail(id, true);
  }
  @Post()
  @ApiCreatedResponse({ type: NewsResponseDto })
  create(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() input: CreateNewsDto) {
    return this.news.create(admin, input);
  }
  @Patch(':id')
  @ApiOkResponse({ type: NewsResponseDto })
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Body() input: UpdateNewsDto,
  ) {
    return this.news.update(admin, id, input);
  }
  @Patch(':id/publication')
  @ApiOkResponse({ type: NewsResponseDto })
  publication(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Body() input: NewsPublicationDto,
  ) {
    return this.news.publication(admin, id, input);
  }
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', uuid) id: string) {
    return this.news.remove(admin, id);
  }
  @Get(':id/cover')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'no-store')
  async cover(@Param('id', uuid) id: string, @Res({ passthrough: true }) response: Response) {
    const cover = await this.news.cover(id, true);
    response.type(cover.mime);
    return new StreamableFile(cover.bytes, { type: cover.mime, disposition: 'inline' });
  }
}
