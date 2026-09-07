import { BadRequestException } from '@nestjs/common';
import { Marketplace } from '../../../generated/prisma/client';

export function marketplaceUrl(marketplace: Marketplace, value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('Invalid marketplace URL.');
  }
  if (
    value !== value.trim() ||
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.hash
  ) {
    throw new BadRequestException(
      'Marketplace links require HTTPS without credentials, port or fragment.',
    );
  }
  // Exact official hosts and product/share paths only. Never fetch user URLs or follow redirects here.
  const shortSharePath = /^\/[A-Za-z0-9_-]+\/?$/;
  const valid =
    marketplace === Marketplace.SHOPEE
      ? (['shopee.vn', 'www.shopee.vn'].includes(url.hostname) &&
          (/^\/product\/[0-9]+\/[0-9]+\/?$/.test(url.pathname) ||
            /-i\.[0-9]+\.[0-9]+\/?$/.test(url.pathname))) ||
        (url.hostname === 'shopee.vn' &&
          /^\/universal-link\/product\/[0-9]+\/[0-9]+\/?$/.test(url.pathname)) ||
        (['s.shopee.vn', 'vn.shp.ee'].includes(url.hostname) && shortSharePath.test(url.pathname))
      : (['www.tiktok.com', 'tiktok.com', 'shop.tiktok.com'].includes(url.hostname) &&
          (/^\/(?:view\/)?product\/[0-9]+\/?$/.test(url.pathname) ||
            /^\/t\/[A-Za-z0-9_-]+\/?$/.test(url.pathname))) ||
        (url.hostname === 'vt.tiktok.com' && shortSharePath.test(url.pathname));
  if (!valid)
    throw new BadRequestException(
      'Use an official Shopee or TikTok Shop product/share link for the selected marketplace.',
    );
  return url.toString();
}
