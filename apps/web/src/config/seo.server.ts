import 'server-only';

import type { Metadata } from 'next';
import { getServerApiBaseUrl } from '@/lib/http/server-client';
import { siteConfig } from './site';

export function siteOrigin(): string {
  const raw = process.env.SITE_URL?.trim() ?? '';
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('SITE_URL must be a valid website origin.');
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('SITE_URL must use HTTPS in production.');
  }
  return url.origin;
}

export function canonicalUrl(path: string): string {
  if (!/^\/(?!\/)/.test(path)) throw new Error('Canonical path must be site-root-relative.');
  return new URL(path, siteOrigin()).toString();
}

export function apiMediaUrl(path: string | null): string | null {
  if (path === null) return null;
  if (!/^\/(?!\/)/.test(path)) throw new Error('Media path must be API-root-relative.');
  return getServerApiBaseUrl() + path;
}

export function pageMetadata(input: {
  title?: string;
  description?: string | null;
  path: string;
  imagePath?: string | null;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
  siteBase?: string;
  apiBase?: string;
  absoluteTitle?: boolean;
}): Metadata {
  const title = input.title ?? siteConfig.name;
  const description = input.description?.trim() || siteConfig.description;
  const canonical = input.siteBase
    ? new URL(input.path, input.siteBase).toString()
    : canonicalUrl(input.path);
  if (input.imagePath && !/^\/(?!\/)/.test(input.imagePath)) {
    throw new Error('Open Graph image path must be API-root-relative.');
  }
  const image = input.imagePath
    ? (input.apiBase ?? getServerApiBaseUrl()) + input.imagePath
    : null;
  return {
    title: input.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical },
    robots: { index: !input.noIndex, follow: !input.noIndex },
    openGraph: {
      type: input.type ?? 'website',
      locale: siteConfig.locale,
      siteName: siteConfig.name,
      url: canonical,
      title,
      description,
      images: image ? [{ url: image }] : [],
      ...(input.type === 'article' ? {
        publishedTime: input.publishedTime,
        modifiedTime: input.modifiedTime,
      } : {}),
    },
  };
}

export function configuredZaloUrl(): string | null {
  const raw = process.env.ZALO_URL?.trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.hostname !== 'zalo.me' || url.username || url.password) {
    throw new Error('ZALO_URL must be an HTTPS zalo.me URL.');
  }
  return url.toString();
}
