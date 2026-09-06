import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarketplaceActions } from './marketplace-actions';

describe('MarketplaceActions', () => {
  it('renders unavailable marketplaces without a fake link', () => {
    const html = renderToStaticMarkup(<MarketplaceActions marketplaces={[{
      marketplace: 'SHOPEE', available: false, url: null, message: 'Chưa có liên kết',
    }]} />);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('Chưa có liên kết');
    expect(html).not.toContain('href=');
  });

  it('uses a protected external link when a marketplace is available', () => {
    const html = renderToStaticMarkup(<MarketplaceActions marketplaces={[{
      marketplace: 'TIKTOK_SHOP', available: true,
      url: 'https://www.tiktok.com/view/product/123', message: null,
    }]} />);
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="https://www.tiktok.com/view/product/123"');
  });
});
