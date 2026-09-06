import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtPolicy {
  readonly accessKey: Buffer;
  readonly refreshKey: Buffer;
  readonly issuer: string;
  readonly accessAudience: string;
  readonly refreshAudience: string;
  readonly accessTtlSeconds = 15 * 60;
  readonly sessionTtlSeconds = 7 * 24 * 60 * 60;

  constructor(config: ConfigService) {
    this.accessKey = this.readKey(config, 'JWT_ACCESS_SECRET');
    this.refreshKey = this.readKey(config, 'JWT_REFRESH_SECRET');
    if (this.accessKey.equals(this.refreshKey)) {
      throw new TypeError('Access and refresh signing keys must be different.');
    }
    this.issuer = this.readLabel(config, 'JWT_ISSUER');
    this.accessAudience = this.readLabel(config, 'JWT_ACCESS_AUDIENCE');
    this.refreshAudience = this.readLabel(config, 'JWT_REFRESH_AUDIENCE');
    if (this.accessAudience === this.refreshAudience) {
      throw new TypeError('Access and refresh audiences must be different.');
    }
  }

  private readKey(config: ConfigService, name: string): Buffer {
    const value = config.get<unknown>(name);
    if (typeof value !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
      throw new TypeError(`${name} must encode 32 random bytes as canonical base64.`);
    }
    const key = Buffer.from(value, 'base64');
    if (key.length !== 32 || key.toString('base64') !== value) {
      throw new TypeError(`${name} must encode 32 random bytes as canonical base64.`);
    }
    return key;
  }

  private readLabel(config: ConfigService, name: string): string {
    const value = config.get<unknown>(name);
    if (typeof value !== 'string' || !value || value.trim() !== value || /\p{Cc}/u.test(value)) {
      throw new TypeError(`${name} must be a nonempty issuer/audience value.`);
    }
    return value;
  }
}
