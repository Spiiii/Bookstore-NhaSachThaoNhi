import type { components } from '@bookstore/contracts';

export type AdminCategory = components['schemas']['CategoryResponseDto'];
export type CategoryWriteInput = components['schemas']['CreateCategoryDto'];
export type CategoryUpdateInput = components['schemas']['UpdateCategoryDto'];

export interface AdminCategoryNode extends AdminCategory {
  treeParentId: string | null;
  children: AdminCategoryNode[];
}

export interface CategoryOption {
  id: string;
  name: string;
  depth: number;
  ancestorIds: string[];
}
