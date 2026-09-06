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
  AdminBannerQueryDto,
  BannerQueryDto,
  CreateBannerDto,
  UpdateBannerDto,
} from './banners.dto';
import { BannerPageDto, BannerResponseDto } from './banners.response';
import { BannersService } from './banners.service';

const validation = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  validationError: { target: false, value: false },
});
const uuid = new ParseUUIDPipe({ version: '4' });
@ApiTags('banners')
@Public()
@Controller('banners')
@UsePipes(validation)
export class BannersPublicController {
  constructor(private readonly banners: BannersService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: BannerPageDto })
  list(@Query() query: BannerQueryDto) {
    return this.banners.list(query, false);
  }
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: BannerResponseDto })
  detail(@Param('id', uuid) id: string) {
    return this.banners.detail(id, false);
  }
  @Get(':id/image')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'no-store')
  async image(@Param('id', uuid) id: string, @Res({ passthrough: true }) response: Response) {
    const image = await this.banners.image(id, false);
    response.type(image.mime);
    return new StreamableFile(image.bytes, { type: image.mime, disposition: 'inline' });
  }
}
@ApiTags('admin-banners')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/banners')
@UsePipes(validation)
export class BannersAdminController {
  constructor(private readonly banners: BannersService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: BannerPageDto })
  list(@Query() query: AdminBannerQueryDto) {
    return this.banners.list(query, true);
  }
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: BannerResponseDto })
  detail(@Param('id', uuid) id: string) {
    return this.banners.detail(id, true);
  }
  @Post()
  @ApiCreatedResponse({ type: BannerResponseDto })
  create(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() input: CreateBannerDto) {
    return this.banners.create(admin, input);
  }
  @Patch(':id')
  @ApiOkResponse({ type: BannerResponseDto })
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Body() input: UpdateBannerDto,
  ) {
    return this.banners.update(admin, id, input);
  }
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', uuid) id: string) {
    return this.banners.remove(admin, id);
  }
  @Get(':id/image')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'no-store')
  async image(@Param('id', uuid) id: string, @Res({ passthrough: true }) response: Response) {
    const image = await this.banners.image(id, true);
    response.type(image.mime);
    return new StreamableFile(image.bytes, { type: image.mime, disposition: 'inline' });
  }
}
