'use client';

import { z } from 'zod';
import { getBrowserClient } from '@/lib/http/browser-client';
import type { AdminProductFilters, AttachProductImageInput, Marketplace, MarketplaceLinkInput, ProductAttributeInput, ProductAttributeUpdateInput, ProductFormOptions, ProductImageInput, ProductWriteInput } from './admin-products.types';
import { adminProductPageSchema, adminProductSchema } from './admin-products.schemas';

type CategoryNode = { id: string; name: string; children: CategoryNode[] };
const categoryNode: z.ZodType<CategoryNode> = z.lazy(() => z.object({
  id: z.uuid(), name: z.string(), children: z.array(categoryNode),
}));
const brandPageSchema = z.object({
  items: z.array(z.object({ id: z.uuid(), name: z.string() })),
  page: z.number().int(), limit: z.number().int(), hasMore: z.boolean(),
});

export const adminProductsApi = {
  async list(filters: AdminProductFilters) {
    const query = new URLSearchParams({ page: String(filters.page), limit: '20' });
    if (filters.q) query.set('q', filters.q);
    if (filters.isActive !== undefined) query.set('isActive', String(filters.isActive));
    return adminProductPageSchema.parse((await getBrowserClient().get(`/admin/products?${query}`)).data);
  },
  async detail(id: string) {
    return adminProductSchema.parse((await getBrowserClient().get(`/admin/products/${id}`)).data);
  },
  async create(input: ProductWriteInput) {
    return adminProductSchema.parse((await getBrowserClient().post('/admin/products', input)).data);
  },
  async update(id: string, input: ProductWriteInput) {
    return adminProductSchema.parse((await getBrowserClient().patch(`/admin/products/${id}`, input)).data);
  },
  async publish(id: string, isActive: boolean) {
    return adminProductSchema.parse((await getBrowserClient().patch(`/admin/products/${id}/publication`, { isActive })).data);
  },
  async remove(id: string) {
    await getBrowserClient().delete(`/admin/products/${id}`);
  },
  async attachImage(id: string, input: AttachProductImageInput) {
    return adminProductSchema.parse((await getBrowserClient().post(`/admin/products/${id}/images`, input)).data);
  },
  async updateImage(id: string, imageId: string, input: ProductImageInput) {
    return adminProductSchema.parse((await getBrowserClient().patch(`/admin/products/${id}/images/${imageId}`, input)).data);
  },
  async removeImage(id: string, imageId: string) {
    await getBrowserClient().delete(`/admin/products/${id}/images/${imageId}`);
  },
  async addAttribute(id: string, input: ProductAttributeInput) {
    return adminProductSchema.parse((await getBrowserClient().post(`/admin/products/${id}/attributes`, input)).data);
  },
  async updateAttribute(id: string, attributeId: string, input: ProductAttributeUpdateInput) {
    return adminProductSchema.parse((await getBrowserClient().patch(`/admin/products/${id}/attributes/${attributeId}`, input)).data);
  },
  async removeAttribute(id: string, attributeId: string) {
    await getBrowserClient().delete(`/admin/products/${id}/attributes/${attributeId}`);
  },
  async setMarketplace(id: string, marketplace: Marketplace, input: MarketplaceLinkInput) {
    return adminProductSchema.parse((await getBrowserClient().put(`/admin/products/${id}/marketplace-links/${marketplace}`, input)).data);
  },
  async removeMarketplace(id: string, marketplace: Marketplace) {
    await getBrowserClient().delete(`/admin/products/${id}/marketplace-links/${marketplace}`);
  },
  async options(): Promise<ProductFormOptions> {
    const [categoryResponse, firstBrands] = await Promise.all([
      getBrowserClient().get('/admin/categories/tree'),
      getBrowserClient().get('/admin/brands?page=1&limit=50'),
    ]);
    const tree = z.array(categoryNode).parse(categoryResponse.data);
    const brands = brandPageSchema.parse(firstBrands.data);
    const allBrands = [...brands.items];
    let hasMore = brands.hasMore;
    for (let page = 2; hasMore && page <= 10_000; page += 1) {
      const next = brandPageSchema.parse((await getBrowserClient().get(`/admin/brands?page=${page}&limit=50`)).data);
      allBrands.push(...next.items);
      hasMore = next.hasMore;
      if (page === 10_000) throw new Error('Brand pagination exceeds the supported limit.');
    }
    const categories: ProductFormOptions['categories'] = [];
    const visit = (nodes: typeof tree, depth: number) => nodes.forEach((node) => {
      categories.push({ id: node.id, name: node.name, depth });
      visit(node.children, depth + 1);
    });
    visit(tree, 0);
    return { categories, brands: allBrands };
  },
};
