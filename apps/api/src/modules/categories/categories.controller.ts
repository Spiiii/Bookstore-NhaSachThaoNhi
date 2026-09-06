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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentAdmin } from '../security/decorators/current-admin.decorator';
import { Public } from '../security/decorators/public.decorator';
import { Roles } from '../security/decorators/roles.decorator';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import {
  AdminCategoryQueryDto,
  CategoryQueryDto,
  CategoryTreeQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './categories.dto';
import { CategoryPageDto, CategoryResponseDto, CategoryTreeNodeDto } from './categories.response';
import { CategoriesService } from './categories.service';

const validation = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  validationError: { target: false, value: false },
});
const uuid = new ParseUUIDPipe({ version: '4' });

@ApiTags('categories')
@Public()
@Controller('categories')
@UsePipes(validation)
export class CategoriesPublicController {
  constructor(private readonly categories: CategoriesService) {}
  @Get()
  @ApiOkResponse({ type: CategoryPageDto })
  list(@Query() query: CategoryQueryDto) {
    return this.categories.list(query, false);
  }
  @Get('tree')
  @ApiOkResponse({ type: [CategoryTreeNodeDto] })
  tree(@Query() _query: CategoryTreeQueryDto) {
    return this.categories.tree(false);
  }
  @Get('by-slug/:slug')
  @ApiOkResponse({ type: CategoryResponseDto })
  detail(@Param('slug') slug: string) {
    return this.categories.detail(slug, false);
  }
}

@ApiTags('admin-categories')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/categories')
@UsePipes(validation)
export class CategoriesAdminController {
  constructor(private readonly categories: CategoriesService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: CategoryPageDto })
  list(@Query() query: AdminCategoryQueryDto) {
    return this.categories.list(query, true);
  }
  @Get('tree')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: [CategoryTreeNodeDto] })
  tree(@Query() _query: CategoryTreeQueryDto) {
    return this.categories.tree(true);
  }
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: CategoryResponseDto })
  detail(@Param('id', uuid) id: string) {
    return this.categories.detail(id, true);
  }
  @Post()
  @ApiCreatedResponse({ type: CategoryResponseDto })
  create(@CurrentAdmin() admin: AuthenticatedAdmin, @Body() input: CreateCategoryDto) {
    return this.categories.create(admin, input);
  }
  @Patch(':id')
  @ApiOkResponse({ type: CategoryResponseDto })
  update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', uuid) id: string,
    @Body() input: UpdateCategoryDto,
  ) {
    return this.categories.update(admin, id, input);
  }
  @Delete(':id')
  @HttpCode(204)
  @ApiNoContentResponse()
  remove(@CurrentAdmin() admin: AuthenticatedAdmin, @Param('id', uuid) id: string) {
    return this.categories.remove(admin, id);
  }
}
