import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Marketplace } from '../../generated/prisma/client';
import { CurrentAdmin } from '../security/decorators/current-admin.decorator';
import { Public } from '../security/decorators/public.decorator';
import { Roles } from '../security/decorators/roles.decorator';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import {
  AdminProductQueryDto,
  AttachImageDto,
  AttributeDto,
  CreateProductDto,
  ImageMetadataDto,
  MarketplaceLinkDto,
  ProductQueryDto,
  PublicationDto,
  UpdateAttributeDto,
  UpdateProductDto,
} from './catalog.dto';
import { ProductPageResponseDto, ProductResponseDto } from './catalog.response';
import { CatalogService } from './catalog.service';

const validation = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  validationError: { target: false, value: false },
});
const uuid = new ParseUUIDPipe({ version: '4' });

@ApiTags('products')
@Public()
@Controller('products')
@UsePipes(validation)
export class CatalogPublicController {
  constructor(private readonly catalog: CatalogService) {}
  @Get()
  @ApiOkResponse({ type: ProductPageResponseDto })
  list(@Query() query: ProductQueryDto) {
    return this.catalog.list(query, false);
  }
  @Get(':slug')
  @ApiOkResponse({ type: ProductResponseDto })
  detail(@Param('slug') slug: string) {
    return this.catalog.detail(slug, false);
  }
  @Get(':slug/images/:imageId')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'no-store')
  async image(
    @Param('slug') slug: string,
    @Param('imageId', uuid) imageId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const image = await this.catalog.image(slug, imageId, false);
    response.type(image.mime);
    return new StreamableFile(image.bytes, { type: image.mime, disposition: 'inline' });
  }
}

@ApiTags('admin-products')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/products')
@UsePipes(validation)
export class CatalogAdminController {
  constructor(private readonly catalog: CatalogService) {}
  @Get()
  @ApiOkResponse({ type: ProductPageResponseDto })
  @Header('Cache-Control', 'no-store')
  list(@Query() query: AdminProductQueryDto) {
    return this.catalog.list(query, true);
  }
  @Get(':id')
  @ApiOkResponse({ type: ProductResponseDto })
  @Header('Cache-Control', 'no-store')
  detail(@Param('id', uuid) id: string) {
    return this.catalog.detail(id, true);
  }
  @Post()
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() body: CreateProductDto) {
    return this.catalog.create(admin, body);
  }
  @Patch(':id')
  @ApiOkResponse({ type: ProductResponseDto })
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.catalog.update(admin, id, body);
  }
  @Patch(':id/publication')
  @ApiOkResponse({ type: ProductResponseDto })
  publish(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Body() body: PublicationDto,
  ) {
    return this.catalog.publish(admin, id, body.isActive);
  }
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', uuid) id: string) {
    return this.catalog.remove(admin, id);
  }
  @Post(':id/images')
  @ApiCreatedResponse({ type: ProductResponseDto })
  attachImage(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Body() body: AttachImageDto,
  ) {
    return this.catalog.attachImage(admin, id, body);
  }
  @Patch(':id/images/:imageId')
  @ApiOkResponse({ type: ProductResponseDto })
  updateImage(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Param('imageId', uuid) imageId: string,
    @Body() body: ImageMetadataDto,
  ) {
    return this.catalog.updateImage(admin, id, imageId, body);
  }
  @Delete(':id/images/:imageId')
  @HttpCode(204)
  @ApiNoContentResponse()
  removeImage(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Param('imageId', uuid) imageId: string,
  ) {
    return this.catalog.removeImage(admin, id, imageId);
  }
  @Get(':id/images/:imageId/content')
  @ApiProduces('image/png', 'image/jpeg', 'image/webp')
  @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'no-store')
  async image(
    @Param('id', uuid) id: string,
    @Param('imageId', uuid) imageId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const image = await this.catalog.image(id, imageId, true);
    response.type(image.mime);
    return new StreamableFile(image.bytes, { type: image.mime, disposition: 'inline' });
  }
  @Post(':id/attributes')
  @ApiCreatedResponse({ type: ProductResponseDto })
  addAttribute(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Body() body: AttributeDto,
  ) {
    return this.catalog.addAttribute(admin, id, body);
  }
  @Patch(':id/attributes/:attributeId')
  @ApiOkResponse({ type: ProductResponseDto })
  updateAttribute(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Param('attributeId', uuid) attributeId: string,
    @Body() body: UpdateAttributeDto,
  ) {
    return this.catalog.updateAttribute(admin, id, attributeId, body);
  }
  @Delete(':id/attributes/:attributeId')
  @HttpCode(204)
  @ApiNoContentResponse()
  removeAttribute(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Param('attributeId', uuid) attributeId: string,
  ) {
    return this.catalog.removeAttribute(admin, id, attributeId);
  }
  @Put(':id/marketplace-links/:marketplace')
  @ApiParam({ name: 'marketplace', enum: Marketplace })
  @ApiOkResponse({ type: ProductResponseDto })
  setMarketplace(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Param('marketplace', new ParseEnumPipe(Marketplace)) marketplace: Marketplace,
    @Body() body: MarketplaceLinkDto,
  ) {
    return this.catalog.setMarketplace(admin, id, marketplace, body);
  }
  @Delete(':id/marketplace-links/:marketplace')
  @ApiParam({ name: 'marketplace', enum: Marketplace })
  @HttpCode(204)
  @ApiNoContentResponse()
  removeMarketplace(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Param('marketplace', new ParseEnumPipe(Marketplace)) marketplace: Marketplace,
  ) {
    return this.catalog.removeMarketplace(admin, id, marketplace);
  }
}
