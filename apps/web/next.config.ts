import type { NextConfig } from 'next';

function apiOrigin(): string {
  const raw = process.env.API_BASE_URL?.trim() ?? '';
  const url = new URL(raw);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new Error('API_BASE_URL must use HTTPS in production or HTTP on localhost.');
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error(
      'API_BASE_URL must be an origin without credentials, path, query, or fragment.',
    );
  }
  return url.origin;
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin()}/:path*` }];
  },
};
export default nextConfig;
