import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Category } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { AuthenticatedAdmin } from '../../security/types/security.types';
import { UsersService } from '../../users/users.service';
import { AdminSessionRejectedError } from '../../users/types/admin-state.types';
import { CategoriesService } from '../categories.service';
import { categoryTree } from '../category-tree';

const row = (
  id: string,
  parentId: string | null = null,
  isActive = true,
  sortOrder = 0,
): Category => ({
  id,
  parentId,
  isActive,
  sortOrder,
  name: id,
  slug: id,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});
const admin = { id: 'admin', sessionId: 'session', authVersion: 1 } as AuthenticatedAdmin;

describe('Category tree projections', () => {
  it('orders siblings and roots deterministically', () => {
    const tree = categoryTree(
      [row('b'), row('a'), row('d', 'a', true, 2), row('c', 'a', true, 1)],
      true,
    );
    expect(tree.map((node) => node.id)).toEqual(['a', 'b']);
    expect(tree[0]!.children.map((node) => node.id)).toEqual(['c', 'd']);
  });
  it('promotes active descendants through hidden ancestors without leaking hidden names', () => {
    const tree = categoryTree(
      [row('root'), row('hidden', 'root', false), row('child', 'hidden')],
      false,
    );
    expect(tree[0]!.children[0]).toMatchObject({
      id: 'child',
      parentId: 'hidden',
      treeParentId: 'root',
    });
    expect(tree[0]!.children).toHaveLength(1);
    expect(tree[0]).not.toHaveProperty('isActive');
    expect(tree[0]).not.toHaveProperty('createdAt');
  });
  it('keeps active children of hidden roots visible at the public root', () => {
    expect(
      categoryTree([row('hidden', null, false), row('child', 'hidden')], false)[0],
    ).toMatchObject({ id: 'child', treeParentId: null });
  });
  it('admin retains inactive nodes and original parents', () => {
    const tree = categoryTree([row('hidden', null, false), row('child', 'hidden')], true);
    expect(tree[0]).toMatchObject({ id: 'hidden', isActive: false });
    expect(tree[0]!.children[0]!.treeParentId).toBe('hidden');
  });
  it('rejects corrupt cycles and missing parents, including wholly hidden cycles', () => {
    expect(() => categoryTree([row('a', 'b'), row('b', 'a')], true)).toThrow(ConflictException);
    expect(() => categoryTree([row('a', 'missing')], false)).toThrow(ConflictException);
    expect(() => categoryTree([row('a', 'b', false), row('b', 'a', false)], false)).toThrow(
      ConflictException,
    );
  });
  it('returns an empty forest when no visible categories exist', () => {
    expect(categoryTree([], true)).toEqual([]);
    expect(categoryTree([row('hidden', null, false)], false)).toEqual([]);
  });
});

describe('Category persistence protocol', () => {
  const category = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const tx = { category };
  const transaction = jest.fn();
  const session = jest.fn();
  const events: string[] = [];
  let service: CategoriesService;
  beforeEach(() => {
    jest.resetAllMocks();
    events.length = 0;
    transaction.mockImplementation(async (work: (client: unknown) => unknown) => work(tx));
    session.mockImplementation(async () => {
      events.push('common-admin-lock');
    });
    category.create.mockResolvedValue(row('new'));
    category.update.mockResolvedValue(row('target'));
    service = new CategoriesService(
      { category, $transaction: transaction } as unknown as PrismaService,
      { assertCurrentSession: session } as unknown as UsersService,
    );
  });
  it('holds the shared session lock before reading ancestors and writing', async () => {
    category.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
      events.push('read:' + where.id);
      return where.id === 'target' ? { id: 'target' } : { parentId: null };
    });
    category.update.mockImplementation(async () => {
      events.push('write');
      return row('target', 'parent');
    });
    await service.update(admin, 'target', { parentId: 'parent' });
    expect(events).toEqual(['common-admin-lock', 'read:target', 'read:parent', 'write']);
    expect(session).toHaveBeenCalledWith(tx, {
      adminId: 'admin',
      sessionId: 'session',
      authVersion: 1,
    });
  });
  it('rejects stale sessions before any category access', async () => {
    session.mockRejectedValue(new AdminSessionRejectedError());
    await expect(service.create(admin, { name: 'New', slug: 'new' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(category.create).not.toHaveBeenCalled();
    expect(category.findUnique).not.toHaveBeenCalled();
  });
  it('rejects self-parenting after normalizing UUID case', async () => {
    category.findUnique.mockResolvedValue({ id: 'target' });
    await expect(service.update(admin, 'TARGET', { parentId: 'TARGET' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(category.update).not.toHaveBeenCalled();
  });
  it('rejects reparenting into a descendant', async () => {
    category.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
      where.id === 'a' ? { id: 'a' } : { parentId: 'a' },
    );
    await expect(service.update(admin, 'a', { parentId: 'b' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(category.update).not.toHaveBeenCalled();
  });
  it('rejects an already cyclic parent chain instead of looping', async () => {
    category.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      parentId: where.id === 'a' ? 'b' : 'a',
    }));
    await expect(
      service.create(admin, { name: 'New', slug: 'new', parentId: 'a' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects a missing parent and supports moving a category to root', async () => {
    category.findUnique.mockResolvedValue(null);
    await expect(
      service.create(admin, { name: 'New', slug: 'new', parentId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    category.findUnique.mockResolvedValue({ id: 'target' });
    await service.update(admin, 'target', { parentId: null });
    expect(category.update).toHaveBeenCalledWith({
      where: { id: 'target' },
      data: { parentId: null },
    });
  });
  it.each([
    { children: 1, products: 0 },
    { children: 0, products: 1 },
  ])('refuses deletion while references remain: %j', async (_count) => {
    category.findUnique.mockResolvedValue({ id: 'target', _count });
    await expect(service.remove(admin, 'target')).rejects.toBeInstanceOf(ConflictException);
    expect(category.delete).not.toHaveBeenCalled();
  });
  it('deletes an unreferenced leaf without moving children or changing products', async () => {
    category.findUnique.mockResolvedValue({ id: 'target', _count: { children: 0, products: 0 } });
    await service.remove(admin, 'target');
    expect(category.delete).toHaveBeenCalledWith({ where: { id: 'target' } });
  });
  it('public reads enforce activity independently of ancestors', async () => {
    category.findMany.mockResolvedValue([]);
    category.findFirst.mockResolvedValue(null);
    await service.list({ page: 1, limit: 20 }, false);
    expect(category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true }, take: 21 }),
    );
    await expect(service.detail('hidden', false)).rejects.toBeInstanceOf(NotFoundException);
    expect(category.findFirst).toHaveBeenCalledWith({ where: { slug: 'hidden', isActive: true } });
  });
});
