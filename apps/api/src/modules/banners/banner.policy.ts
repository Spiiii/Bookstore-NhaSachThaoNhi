import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BannerPolicy {
  readonly placements: readonly string[];
  constructor(config: ConfigService) {
    const raw = config.get<unknown>('BANNER_PLACEMENTS') ?? 'home-hero';
    if (typeof raw !== 'string')
      throw new Error('BANNER_PLACEMENTS must be a comma-separated string.');
    const values = raw.split(',').map((value) => value.trim());
    if (
      !values.length ||
      values.some(
        (value) => value.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$(?![\s\S])/.test(value),
      )
    )
      throw new Error('BANNER_PLACEMENTS contains an invalid placement.');
    this.placements = Object.freeze([...new Set(values)]);
  }
  assertPlacement(value: string): void {
    if (!this.placements.includes(value))
      throw new BadRequestException('Unsupported banner placement.');
  }
  target(value: string): string {
    try {
      if (value !== value.trim() || /[\\\p{Cc}]/u.test(value)) throw new Error();
      const internal = value.startsWith('/');
      if (value.startsWith('//')) throw new Error();
      const base = 'https://banner.invalid';
      const url = internal ? new URL(value, base) : new URL(value);
      if (url.protocol !== 'https:' || !url.hostname || url.username || url.password)
        throw new Error();
      if (
        internal &&
        (url.origin !== base ||
          url.pathname.startsWith('//') ||
          /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(url.pathname))
      )
        throw new Error();
      const result = internal ? url.pathname + url.search + url.hash : url.toString();
      if (result.length > 2048) throw new Error();
      return result;
    } catch {
      throw new BadRequestException(
        'Target must be a safe internal path or HTTPS URL without credentials (max 2048 characters).',
      );
    }
  }
}
