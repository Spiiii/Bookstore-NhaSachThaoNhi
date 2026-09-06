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
import { AdminBrandQueryDto, BrandQueryDto, CreateBrandDto, UpdateBrandDto } from './brands.dto';
import { BrandPageDto, BrandResponseDto } from './brands.response';
import { BrandsService } from './brands.service';

const validation = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  validationError: { target: false, value: false },
});
const uuid = new ParseUUIDPipe({ version: '4' });
@ApiTags('brands')
@Public()
@Controller('brands')
@UsePipes(validation)
export class BrandsPublicController {
  constructor(private readonly brands: BrandsService) {}
  @Get()
  @ApiOkResponse({ type: BrandPageDto })
  list(@Query() query: BrandQueryDto) {
    return this.brands.list(query, false);
  }
  @Get('by-slug/:slug')
  @ApiOkResponse({ type: BrandResponseDto })
  detail(@Param('slug') slug: string) {
    return this.brands.detail(slug, false);
  }
  @Get('by-slug/:slug/logo')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'no-store')
  async logo(@Param('slug') slug: string, @Res({ passthrough: true }) response: Response) {
    const logo = await this.brands.logo(slug, false);
    response.type(logo.mime);
    return new StreamableFile(logo.bytes, { type: logo.mime, disposition: 'inline' });
  }
}
@ApiTags('admin-brands')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/brands')
@UsePipes(validation)
export class BrandsAdminController {
  constructor(private readonly brands: BrandsService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: BrandPageDto })
  list(@Query() query: AdminBrandQueryDto) {
    return this.brands.list(query, true);
  }
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: BrandResponseDto })
  detail(@Param('id', uuid) id: string) {
    return this.brands.detail(id, true);
  }
  @Post()
  @ApiCreatedResponse({ type: BrandResponseDto })
  create(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() input: CreateBrandDto) {
    return this.brands.create(admin, input);
  }
  @Patch(':id')
  @ApiOkResponse({ type: BrandResponseDto })
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Body() input: UpdateBrandDto,
  ) {
    return this.brands.update(admin, id, input);
  }
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', uuid) id: string) {
    return this.brands.remove(admin, id);
  }
  @Get(':id/logo')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'no-store')
  async logo(@Param('id', uuid) id: string, @Res({ passthrough: true }) response: Response) {
    const logo = await this.brands.logo(id, true);
    response.type(logo.mime);
    return new StreamableFile(logo.bytes, { type: logo.mime, disposition: 'inline' });
  }
}
