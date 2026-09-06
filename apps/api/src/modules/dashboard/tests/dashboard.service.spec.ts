import { DashboardService } from '../dashboard.service';

describe('DashboardService', () => {
  it('combines database counts into a product-facing summary', async () => {
    const count = jest.fn()
      .mockResolvedValueOnce(12).mockResolvedValueOnce(8).mockResolvedValueOnce(2)
      .mockResolvedValueOnce(5).mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3).mockResolvedValueOnce(2)
      .mockResolvedValueOnce(9).mockResolvedValueOnce(6).mockResolvedValueOnce(2).mockResolvedValueOnce(1)
      .mockResolvedValueOnce(4).mockResolvedValueOnce(3);
    const prisma = {
      product: { count }, category: { count }, brand: { count }, news: { count }, banner: { count },
    };
    const service = new DashboardService(prisma as never);

    const result = await service.summary();

    expect(result.products).toEqual({ total: 12, active: 8, missingImages: 2 });
    expect(result.categories).toEqual({ total: 5, active: 4 });
    expect(result.brands).toEqual({ total: 3, active: 2 });
    expect(result.news).toEqual({ total: 9, published: 6, draft: 2, archived: 1 });
    expect(result.banners).toEqual({ total: 4, active: 3 });
    expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
  });
});
