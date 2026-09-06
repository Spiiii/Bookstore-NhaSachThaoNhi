import { z } from 'zod';

export const adminCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  parentId: z.uuid().nullable(),
  sortOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type AdminCategoryNodeSchema = z.infer<typeof adminCategorySchema> & {
  treeParentId: string | null;
  children: AdminCategoryNodeSchema[];
};

export const adminCategoryTreeSchema: z.ZodType<AdminCategoryNodeSchema> = z.lazy(() =>
  adminCategorySchema.extend({
    treeParentId: z.uuid().nullable(),
    children: z.array(adminCategoryTreeSchema),
  }),
);

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục là bắt buộc.').max(160),
  slug: z.string().trim().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.'),
  description: z.string().max(100_000),
  parentId: z.union([z.literal(''), z.uuid('Danh mục cha không hợp lệ.')]),
  sortOrder: z.string().regex(/^(0|[1-9][0-9]{0,9})$/, 'Thứ tự phải là số nguyên không âm.'),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
