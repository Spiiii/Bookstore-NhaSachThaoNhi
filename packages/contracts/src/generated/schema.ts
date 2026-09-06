/** Generated from the Bookstore OpenAPI snapshot. Do not edit manually. */
export interface paths {
  '/admin/banners': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BannersAdminController_list'];
    put?: never;
    post: operations['BannersAdminController_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/banners/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BannersAdminController_detail'];
    put?: never;
    post?: never;
    delete: operations['BannersAdminController_remove'];
    options?: never;
    head?: never;
    patch: operations['BannersAdminController_update'];
    trace?: never;
  };
  '/admin/banners/{id}/image': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BannersAdminController_image'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/brands': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BrandsAdminController_list'];
    put?: never;
    post: operations['BrandsAdminController_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/brands/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BrandsAdminController_detail'];
    put?: never;
    post?: never;
    delete: operations['BrandsAdminController_remove'];
    options?: never;
    head?: never;
    patch: operations['BrandsAdminController_update'];
    trace?: never;
  };
  '/admin/brands/{id}/logo': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BrandsAdminController_logo'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CategoriesAdminController_list'];
    put?: never;
    post: operations['CategoriesAdminController_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/categories/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CategoriesAdminController_detail'];
    put?: never;
    post?: never;
    delete: operations['CategoriesAdminController_remove'];
    options?: never;
    head?: never;
    patch: operations['CategoriesAdminController_update'];
    trace?: never;
  };
  '/admin/categories/tree': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CategoriesAdminController_tree'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/news': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['NewsAdminController_list'];
    put?: never;
    post: operations['NewsAdminController_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/news/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['NewsAdminController_detail'];
    put?: never;
    post?: never;
    delete: operations['NewsAdminController_remove'];
    options?: never;
    head?: never;
    patch: operations['NewsAdminController_update'];
    trace?: never;
  };
  '/admin/news/{id}/cover': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['NewsAdminController_cover'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/news/{id}/publication': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: operations['NewsAdminController_publication'];
    trace?: never;
  };
  '/admin/products': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CatalogAdminController_list'];
    put?: never;
    post: operations['CatalogAdminController_create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/products/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CatalogAdminController_detail'];
    put?: never;
    post?: never;
    delete: operations['CatalogAdminController_remove'];
    options?: never;
    head?: never;
    patch: operations['CatalogAdminController_update'];
    trace?: never;
  };
  '/admin/products/{id}/attributes': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['CatalogAdminController_addAttribute'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/products/{id}/attributes/{attributeId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: operations['CatalogAdminController_removeAttribute'];
    options?: never;
    head?: never;
    patch: operations['CatalogAdminController_updateAttribute'];
    trace?: never;
  };
  '/admin/products/{id}/images': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['CatalogAdminController_attachImage'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/products/{id}/images/{imageId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete: operations['CatalogAdminController_removeImage'];
    options?: never;
    head?: never;
    patch: operations['CatalogAdminController_updateImage'];
    trace?: never;
  };
  '/admin/products/{id}/images/{imageId}/content': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CatalogAdminController_image'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/products/{id}/marketplace-links/{marketplace}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put: operations['CatalogAdminController_setMarketplace'];
    post?: never;
    delete: operations['CatalogAdminController_removeMarketplace'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/products/{id}/publication': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: operations['CatalogAdminController_publish'];
    trace?: never;
  };
  '/admin/uploads': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['UploadsController_upload'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/change-password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['AuthController_changePassword'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['AuthController_login'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Idempotent logout using refresh cookie or access Bearer token */
    post: operations['AuthController_logout'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['AuthController_me'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/refresh': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['AuthController_refresh'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/banners': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BannersPublicController_list'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/banners/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BannersPublicController_detail'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/banners/{id}/image': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BannersPublicController_image'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/brands': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BrandsPublicController_list'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/brands/by-slug/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BrandsPublicController_detail'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/brands/by-slug/{slug}/logo': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['BrandsPublicController_logo'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CategoriesPublicController_list'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/categories/by-slug/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CategoriesPublicController_detail'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/categories/tree': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CategoriesPublicController_tree'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/health/live': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['HealthController_liveness'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/health/ready': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['HealthController_readiness'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/news': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['NewsPublicController_list'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/news/by-slug/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['NewsPublicController_detail'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/news/by-slug/{slug}/cover': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['NewsPublicController_cover'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/products': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CatalogPublicController_list'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/products/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CatalogPublicController_detail'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/products/{slug}/images/{imageId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['CatalogPublicController_image'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    AccessTokenDto: {
      accessToken: string;
      /** @enum {string} */
      tokenType: 'Bearer';
    };
    AdminProfileDto: {
      displayName: string;
      /** Format: email */
      email: string;
      /** Format: uuid */
      id: string;
      /** @enum {string} */
      role: 'ADMIN';
    };
    AttachImageDto: {
      altText?: string | null;
      isPrimary?: boolean;
      sortOrder?: number;
      /**
       * Format: uuid
       * @description Existing immutable Storage object key produced by upload
       */
      storageKey: string;
    };
    AttributeDto: {
      key: string;
      label: string;
      sortOrder?: number;
      value: string;
    };
    BannerPageDto: {
      hasMore: boolean;
      items: components['schemas']['BannerResponseDto'][];
      limit: number;
      page: number;
    };
    BannerResponseDto: {
      altText: string;
      /**
       * Format: date-time
       * @description Admin only
       */
      createdAt?: string;
      /**
       * Format: date-time
       * @description Admin only; exclusive
       */
      endAt?: string | null;
      /** Format: uuid */
      id: string;
      /** @description Admin only */
      imageKey?: string;
      imageUrl: string;
      /** @description Admin only */
      isActive?: boolean;
      placement: string;
      sortOrder: number;
      /**
       * Format: date-time
       * @description Admin only; inclusive
       */
      startAt?: string | null;
      targetUrl: string | null;
      /** @description Admin only */
      title?: string;
      /**
       * Format: date-time
       * @description Admin only
       */
      updatedAt?: string;
    };
    BrandPageDto: {
      hasMore: boolean;
      items: components['schemas']['BrandResponseDto'][];
      limit: number;
      page: number;
    };
    BrandResponseDto: {
      /**
       * Format: date-time
       * @description Admin only
       */
      createdAt?: string;
      description: string | null;
      /** Format: uuid */
      id: string;
      /** @description Admin only */
      isActive?: boolean;
      /** @description Admin only */
      logoKey?: string | null;
      /** @description API-relative logo route; resolve with the API mount prefix */
      logoUrl: string | null;
      name: string;
      slug: string;
      /**
       * Format: date-time
       * @description Admin only
       */
      updatedAt?: string;
      /** Format: uri */
      websiteUrl: string | null;
    };
    CategoryPageDto: {
      hasMore: boolean;
      items: components['schemas']['CategoryResponseDto'][];
      limit: number;
      page: number;
    };
    CategoryResponseDto: {
      /**
       * Format: date-time
       * @description Admin only
       */
      createdAt?: string;
      description: string | null;
      /** Format: uuid */
      id: string;
      /** @description Admin only */
      isActive?: boolean;
      name: string;
      /**
       * Format: uuid
       * @description Stored parent, which may be hidden publicly
       */
      parentId: string | null;
      slug: string;
      sortOrder: number;
      /**
       * Format: date-time
       * @description Admin only
       */
      updatedAt?: string;
    };
    CategoryTreeNodeDto: {
      children: components['schemas']['CategoryTreeNodeDto'][];
      /**
       * Format: date-time
       * @description Admin only
       */
      createdAt?: string;
      description: string | null;
      /** Format: uuid */
      id: string;
      /** @description Admin only */
      isActive?: boolean;
      name: string;
      /**
       * Format: uuid
       * @description Stored parent, which may be hidden publicly
       */
      parentId: string | null;
      slug: string;
      sortOrder: number;
      /**
       * Format: uuid
       * @description Parent in this visible tree; null means visible root
       */
      treeParentId: string | null;
      /**
       * Format: date-time
       * @description Admin only
       */
      updatedAt?: string;
    };
    ChangePasswordDto: {
      /** Format: password */
      currentPassword: string;
      /** Format: password */
      newPassword: string;
    };
    CreateBannerDto: {
      /** @description Empty for decorative images */
      altText: string;
      /**
       * Format: date-time
       * @description Exclusive end, timezone required; maps to Banner.endsAt
       */
      endAt?: string | null;
      /**
       * Format: uuid
       * @description Existing immutable uploaded image
       */
      imageKey: string;
      /** @default false */
      isActive: boolean;
      /**
       * @description Configured placement allowlist
       * @example home-hero
       */
      placement: string;
      /** @default 0 */
      sortOrder: number;
      /**
       * Format: date-time
       * @description Inclusive start, timezone required; maps to Banner.startsAt
       */
      startAt?: string | null;
      /** @description Site-root-relative path or HTTPS URL */
      targetUrl?: string | null;
      /** @description Internal label */
      title: string;
    };
    CreateBrandDto: {
      /** @description Plain text */
      description?: string | null;
      /** @default true */
      isActive: boolean;
      /**
       * Format: uuid
       * @description Existing immutable uploaded logo object
       */
      logoKey?: string | null;
      name: string;
      slug: string;
      /** Format: uri */
      websiteUrl?: string | null;
    };
    CreateCategoryDto: {
      /** @description Plain text */
      description?: string | null;
      /** @default true */
      isActive: boolean;
      name: string;
      /** Format: uuid */
      parentId?: string | null;
      slug: string;
      /** @default 0 */
      sortOrder: number;
    };
    CreateNewsDto: {
      /** @description Markdown source; never rendered HTML */
      content: string;
      /**
       * Format: uuid
       * @description Existing immutable uploaded cover object
       */
      coverKey?: string | null;
      /** @description Plain text summary and SEO description */
      excerpt?: string | null;
      slug: string;
      title: string;
    };
    CreateProductDto: {
      /** Format: uuid */
      brandId?: string | null;
      /** Format: uuid */
      categoryId?: string | null;
      /** @description Markdown; render with the approved safe renderer */
      description?: string | null;
      name: string;
      /** @description Integer VND amount, at most 14 digits; null means contact for price */
      referencePrice?: string | null;
      sku: string;
      slug: string;
      summary?: string | null;
    };
    HealthResponseDto: {
      /** @enum {string} */
      status: 'ok';
    };
    ImageMetadataDto: {
      altText?: string | null;
      isPrimary?: boolean;
      sortOrder?: number;
    };
    LoginDto: {
      /** Format: email */
      email: string;
      /** Format: password */
      password: string;
    };
    MarketplaceButtonResponseDto: {
      available: boolean;
      /** @enum {string} */
      marketplace: 'SHOPEE' | 'TIKTOK_SHOP';
      message: string | null;
      url: string | null;
    };
    MarketplaceLinkDto: {
      isActive?: boolean;
      /** Format: uri */
      url: string;
    };
    MarketplaceLinkResponseDto: {
      /** Format: date-time */
      createdAt: string;
      /** Format: uuid */
      id: string;
      isActive: boolean;
      /** @enum {string} */
      marketplace: 'SHOPEE' | 'TIKTOK_SHOP';
      /** Format: uuid */
      productId: string;
      /** Format: date-time */
      updatedAt: string;
      url: string;
    };
    NewsPageDto: {
      hasMore: boolean;
      items: components['schemas']['NewsResponseDto'][];
      limit: number;
      page: number;
    };
    NewsPublicationDto: {
      /**
       * Format: date-time
       * @description PUBLISHED only: explicit time with timezone, or server time when publishing. Future dates schedule visibility.
       */
      publishedAt?: string;
      /** @enum {string} */
      status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    };
    NewsResponseDto: {
      /**
       * Format: uuid
       * @description Admin only
       */
      authorId?: string;
      /** @description Markdown source, detail responses only */
      content?: string;
      /** @description Admin only */
      coverKey?: string | null;
      coverUrl: string | null;
      /**
       * Format: date-time
       * @description Admin only
       */
      createdAt?: string;
      excerpt: string | null;
      /** Format: uuid */
      id: string;
      /** Format: date-time */
      publishedAt: string | null;
      seo: components['schemas']['NewsSeoDto'];
      slug: string;
      /**
       * @description Admin only
       * @enum {string}
       */
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      title: string;
      /** Format: date-time */
      updatedAt: string;
    };
    NewsSeoDto: {
      /** @description Website-relative path; resolve against configured canonical website origin */
      canonicalPath: string;
      description: string | null;
      /** @description API-relative cover URL; admin preview requires Bearer authentication */
      imageUrl: string | null;
      noIndex: boolean;
      title: string;
      /** @enum {string} */
      type: 'article';
    };
    ProductAttributeResponseDto: {
      /** Format: uuid */
      id: string;
      key: string;
      label: string;
      sortOrder: number;
      value: string;
    };
    ProductImageResponseDto: {
      altText: string | null;
      /** Format: uuid */
      id: string;
      isPrimary: boolean;
      sortOrder: number;
      /** @description Admin responses only */
      storageKey?: string;
      /** @description API-relative URL; apply the configured API mount prefix */
      url: string;
    };
    ProductPageResponseDto: {
      hasMore: boolean;
      items: components['schemas']['ProductResponseDto'][];
      limit: number;
      page: number;
    };
    ProductResponseDto: {
      /** @description Detail responses only */
      attributes?: components['schemas']['ProductAttributeResponseDto'][];
      /** Format: uuid */
      brandId: string | null;
      /** Format: uuid */
      categoryId: string | null;
      /**
       * Format: date-time
       * @description Admin only
       */
      createdAt?: string;
      /** @enum {string} */
      currency: 'VND';
      /** @description Markdown; detail responses only */
      description?: string | null;
      /** Format: uuid */
      id: string;
      images: components['schemas']['ProductImageResponseDto'][];
      /** @description Admin only */
      isActive?: boolean;
      /** @description Admin only; includes inactive links */
      marketplaceLinks?: components['schemas']['MarketplaceLinkResponseDto'][];
      marketplaces: components['schemas']['MarketplaceButtonResponseDto'][];
      name: string;
      /** @description Integer VND string; null means contact for price */
      referencePrice: string | null;
      sku: string;
      slug: string;
      summary: string | null;
      /**
       * Format: date-time
       * @description Admin only
       */
      updatedAt?: string;
    };
    PublicationDto: {
      isActive: boolean;
    };
    UpdateAttributeDto: {
      key?: string;
      label?: string;
      sortOrder?: number;
      value?: string;
    };
    UpdateBannerDto: {
      /** @description Empty for decorative images */
      altText?: string;
      /**
       * Format: date-time
       * @description Exclusive end, timezone required; maps to Banner.endsAt
       */
      endAt?: string | null;
      /**
       * Format: uuid
       * @description Existing immutable uploaded image
       */
      imageKey?: string;
      /** @default false */
      isActive: boolean;
      /**
       * @description Configured placement allowlist
       * @example home-hero
       */
      placement?: string;
      /** @default 0 */
      sortOrder: number;
      /**
       * Format: date-time
       * @description Inclusive start, timezone required; maps to Banner.startsAt
       */
      startAt?: string | null;
      /** @description Site-root-relative path or HTTPS URL */
      targetUrl?: string | null;
      /** @description Internal label */
      title?: string;
    };
    UpdateBrandDto: {
      /** @description Plain text */
      description?: string | null;
      /** @default true */
      isActive: boolean;
      /**
       * Format: uuid
       * @description Existing immutable uploaded logo object
       */
      logoKey?: string | null;
      name?: string;
      slug?: string;
      /** Format: uri */
      websiteUrl?: string | null;
    };
    UpdateCategoryDto: {
      /** @description Plain text */
      description?: string | null;
      /** @default true */
      isActive: boolean;
      name?: string;
      /** Format: uuid */
      parentId?: string | null;
      slug?: string;
      /** @default 0 */
      sortOrder: number;
    };
    UpdateNewsDto: {
      /** @description Markdown source; never rendered HTML */
      content?: string;
      /**
       * Format: uuid
       * @description Existing immutable uploaded cover object
       */
      coverKey?: string | null;
      /** @description Plain text summary and SEO description */
      excerpt?: string | null;
      slug?: string;
      title?: string;
    };
    UpdateProductDto: {
      /** Format: uuid */
      brandId?: string | null;
      /** Format: uuid */
      categoryId?: string | null;
      /** @description Markdown; render with the approved safe renderer */
      description?: string | null;
      name?: string;
      /** @description Integer VND amount, at most 14 digits; null means contact for price */
      referencePrice?: string | null;
      sku?: string;
      slug?: string;
      summary?: string | null;
    };
    UploadResponseDto: {
      height: number;
      /** @enum {string} */
      mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
      /** @description Stored sanitized image size in bytes */
      size: number;
      /**
       * Format: uuid
       * @description Use as storageKey, imageKey, coverKey or logoKey in the owning content API
       */
      storageKey: string;
      width: number;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  BannersAdminController_list: {
    parameters: {
      query?: {
        isActive?: boolean;
        placement?: string;
        /** @description Internal title substring */
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BannerPageDto'];
        };
      };
    };
  };
  BannersAdminController_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateBannerDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BannerResponseDto'];
        };
      };
    };
  };
  BannersAdminController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BannerResponseDto'];
        };
      };
    };
  };
  BannersAdminController_remove: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  BannersAdminController_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateBannerDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BannerResponseDto'];
        };
      };
    };
  };
  BannersAdminController_image: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'image/jpeg': string;
          'image/png': string;
          'image/webp': string;
        };
      };
    };
  };
  BrandsAdminController_list: {
    parameters: {
      query?: {
        isActive?: boolean;
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BrandPageDto'];
        };
      };
    };
  };
  BrandsAdminController_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateBrandDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BrandResponseDto'];
        };
      };
    };
  };
  BrandsAdminController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BrandResponseDto'];
        };
      };
    };
  };
  BrandsAdminController_remove: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  BrandsAdminController_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateBrandDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BrandResponseDto'];
        };
      };
    };
  };
  BrandsAdminController_logo: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'image/jpeg': string;
          'image/png': string;
          'image/webp': string;
        };
      };
    };
  };
  CategoriesAdminController_list: {
    parameters: {
      query?: {
        isActive?: boolean;
        /** @description Stored direct parent ID */
        parentId?: string;
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategoryPageDto'];
        };
      };
    };
  };
  CategoriesAdminController_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateCategoryDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategoryResponseDto'];
        };
      };
    };
  };
  CategoriesAdminController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategoryResponseDto'];
        };
      };
    };
  };
  CategoriesAdminController_remove: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CategoriesAdminController_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateCategoryDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategoryResponseDto'];
        };
      };
    };
  };
  CategoriesAdminController_tree: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategoryTreeNodeDto'][];
        };
      };
    };
  };
  NewsAdminController_list: {
    parameters: {
      query?: {
        /** @description Literal title substring */
        q?: string;
        status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NewsPageDto'];
        };
      };
    };
  };
  NewsAdminController_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateNewsDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NewsResponseDto'];
        };
      };
    };
  };
  NewsAdminController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NewsResponseDto'];
        };
      };
    };
  };
  NewsAdminController_remove: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  NewsAdminController_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateNewsDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NewsResponseDto'];
        };
      };
    };
  };
  NewsAdminController_cover: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'image/jpeg': string;
          'image/png': string;
          'image/webp': string;
        };
      };
    };
  };
  NewsAdminController_publication: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['NewsPublicationDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NewsResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_list: {
    parameters: {
      query?: {
        brandId?: string;
        categoryId?: string;
        isActive?: boolean;
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductPageResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CreateProductDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_remove: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CatalogAdminController_update: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateProductDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_addAttribute: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AttributeDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_removeAttribute: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        attributeId: string;
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CatalogAdminController_updateAttribute: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        attributeId: string;
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UpdateAttributeDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_attachImage: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AttachImageDto'];
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_removeImage: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        imageId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CatalogAdminController_updateImage: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        imageId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ImageMetadataDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_image: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        imageId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'image/jpeg': string;
          'image/png': string;
          'image/webp': string;
        };
      };
    };
  };
  CatalogAdminController_setMarketplace: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        marketplace: 'SHOPEE' | 'TIKTOK_SHOP';
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['MarketplaceLinkDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  CatalogAdminController_removeMarketplace: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
        marketplace: 'SHOPEE' | 'TIKTOK_SHOP';
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CatalogAdminController_publish: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PublicationDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  UploadsController_upload: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'multipart/form-data': {
          /** Format: binary */
          file: string;
        };
      };
    };
    responses: {
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UploadResponseDto'];
        };
      };
    };
  };
  AuthController_changePassword: {
    parameters: {
      query?: never;
      header: {
        /** @description An explicitly trusted browser origin */
        Origin: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ChangePasswordDto'];
      };
    };
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  AuthController_login: {
    parameters: {
      query?: never;
      header: {
        /** @description An explicitly trusted browser origin */
        Origin: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['LoginDto'];
      };
    };
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AccessTokenDto'];
        };
      };
    };
  };
  AuthController_logout: {
    parameters: {
      query?: never;
      header: {
        /** @description An explicitly trusted browser origin */
        Origin: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  AuthController_me: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AdminProfileDto'];
        };
      };
    };
  };
  AuthController_refresh: {
    parameters: {
      query?: never;
      header: {
        /** @description An explicitly trusted browser origin */
        Origin: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AccessTokenDto'];
        };
      };
    };
  };
  BannersPublicController_list: {
    parameters: {
      query?: {
        placement?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BannerPageDto'];
        };
      };
    };
  };
  BannersPublicController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BannerResponseDto'];
        };
      };
    };
  };
  BannersPublicController_image: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'image/jpeg': string;
          'image/png': string;
          'image/webp': string;
        };
      };
    };
  };
  BrandsPublicController_list: {
    parameters: {
      query?: {
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BrandPageDto'];
        };
      };
    };
  };
  BrandsPublicController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BrandResponseDto'];
        };
      };
    };
  };
  BrandsPublicController_logo: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'image/jpeg': string;
          'image/png': string;
          'image/webp': string;
        };
      };
    };
  };
  CategoriesPublicController_list: {
    parameters: {
      query?: {
        /** @description Stored direct parent ID */
        parentId?: string;
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategoryPageDto'];
        };
      };
    };
  };
  CategoriesPublicController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategoryResponseDto'];
        };
      };
    };
  };
  CategoriesPublicController_tree: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategoryTreeNodeDto'][];
        };
      };
    };
  };
  HealthController_liveness: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HealthResponseDto'];
        };
      };
    };
  };
  HealthController_readiness: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HealthResponseDto'];
        };
      };
      /** @description Primary database is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  NewsPublicController_list: {
    parameters: {
      query?: {
        /** @description Literal title substring */
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NewsPageDto'];
        };
      };
    };
  };
  NewsPublicController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NewsResponseDto'];
        };
      };
    };
  };
  NewsPublicController_cover: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'image/jpeg': string;
          'image/png': string;
          'image/webp': string;
        };
      };
    };
  };
  CatalogPublicController_list: {
    parameters: {
      query?: {
        brandId?: string;
        categoryId?: string;
        q?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductPageResponseDto'];
        };
      };
    };
  };
  CatalogPublicController_detail: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProductResponseDto'];
        };
      };
    };
  };
  CatalogPublicController_image: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        imageId: string;
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'image/jpeg': string;
          'image/png': string;
          'image/webp': string;
        };
      };
    };
  };
}
