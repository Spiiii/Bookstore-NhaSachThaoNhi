import 'server-only';
import { z } from 'zod';
import { getPublicApi } from '@/lib/http/public-api.server';

export type PublicCategory = {
  id: string; name: string; slug: string; description: string | null; parentId: string | null;
  treeParentId: string | null; sortOrder: number; children: PublicCategory[];
};
const categorySchema: z.ZodType<PublicCategory> = z.lazy(() => z.object({
  id: z.uuid(), name: z.string(), slug: z.string(), description: z.string().nullable(),
  parentId: z.uuid().nullable(), treeParentId: z.uuid().nullable(), sortOrder: z.number().int(),
  children: z.array(categorySchema),
}));

export function listPublicCategoryTree() {
  return getPublicApi('/categories/tree', z.array(categorySchema));
}
