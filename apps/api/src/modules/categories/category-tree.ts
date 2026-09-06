import { ConflictException } from '@nestjs/common';
import type { Category } from '../../generated/prisma/client';
import type { CategoryResponseDto, CategoryTreeNodeDto } from './categories.response';

export function categoryResponse(row: Category, admin: boolean): CategoryResponseDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    ...(admin
      ? { isActive: row.isActive, createdAt: row.createdAt, updatedAt: row.updatedAt }
      : {}),
  };
}

/** Iterative traversal detects corrupt cycles/orphans before linking nodes, including hidden ancestors. */
export function categoryTree(rows: Category[], admin: boolean): CategoryTreeNodeDto[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const complete = new Set<string>();
  for (const row of rows) {
    const path = new Set<string>();
    let current: string | null = row.id;
    while (current !== null && !complete.has(current)) {
      if (path.has(current) || !byId.has(current))
        throw new ConflictException({
          code: 'CATEGORY_TREE_INVALID',
          message: 'Category tree contains a cycle or missing parent.',
        });
      path.add(current);
      current = byId.get(current)!.parentId;
    }
    for (const id of path) complete.add(id);
  }
  const nodes = new Map<string, CategoryTreeNodeDto>();
  const visible = rows
    .filter((row) => admin || row.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const row of visible)
    nodes.set(row.id, { ...categoryResponse(row, admin), treeParentId: null, children: [] });
  const nearest = new Map<string, string | null>();
  const visibleParent = (id: string | null): string | null => {
    if (id === null) return null;
    const hidden: string[] = [];
    let current: string | null = id;
    while (current !== null && !nodes.has(current) && !nearest.has(current)) {
      hidden.push(current);
      current = byId.get(current)!.parentId;
    }
    const parent = current === null ? null : nodes.has(current) ? current : nearest.get(current)!;
    for (const key of hidden) nearest.set(key, parent);
    return parent;
  };
  const roots: CategoryTreeNodeDto[] = [];
  for (const row of visible) {
    const node = nodes.get(row.id)!;
    node.treeParentId = visibleParent(row.parentId);
    if (node.treeParentId === null) roots.push(node);
    else nodes.get(node.treeParentId)!.children.push(node);
  }
  return roots;
}
