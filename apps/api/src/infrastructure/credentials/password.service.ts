import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';

const MAX_PASSWORD_BYTES = 1024;
const MAX_ENCODED_LENGTH = 255;
const MAX_MEMORY_COST = 262_144;
const MAX_TIME_COST = 10;
const MAX_PARALLELISM = 4;
const ARGON2ID_ENCODING =
  /^\$argon2id\$v=19\$([mtp]=[1-9]\d*(?:,[mtp]=[1-9]\d*){2})\$([A-Za-z0-9+/]{11,86})\$([A-Za-z0-9+/]{22,86})$/;

@Injectable()
export class PasswordService {
  private readonly options: Readonly<argon2.HashOptions & { type: typeof argon2.argon2id }>;

  constructor(config: ConfigService) {
    this.options = Object.freeze({
      type: argon2.argon2id,
      version: 0x13,
      hashLength: 32,
      memoryCost: this.readCost(
        config,
        'PASSWORD_ARGON2_MEMORY_COST',
        65_536,
        19_456,
        MAX_MEMORY_COST,
      ),
      timeCost: this.readCost(config, 'PASSWORD_ARGON2_TIME_COST', 3, 2, MAX_TIME_COST),
      parallelism: this.readCost(config, 'PASSWORD_ARGON2_PARALLELISM', 1, 1, MAX_PARALLELISM),
    });
  }

  /** Returns a PHC string containing the algorithm, parameters, random salt and digest. */
  async hash(password: string): Promise<string> {
    if (!this.isValidInput(password)) {
      throw new TypeError(`Password must contain between 1 and ${MAX_PASSWORD_BYTES} UTF-8 bytes.`);
    }

    return argon2.hash(password, { ...this.options, salt: randomBytes(16) });
  }

  /** Invalid input, unsupported/corrupt hashes and verification failures return false. */
  async verify(password: string, encodedHash: string): Promise<boolean> {
    if (!this.isValidInput(password) || !this.isSupportedHash(encodedHash)) {
      return false;
    }

    try {
      return await argon2.verify(encodedHash, password);
    } catch {
      return false;
    }
  }

  /** The caller may rehash only after successful verification; this method writes nothing. */
  needsRehash(encodedHash: string): boolean {
    if (!this.isSupportedHash(encodedHash)) {
      return true;
    }

    const [, , salt = '', digest = ''] = ARGON2ID_ENCODING.exec(encodedHash) ?? [];
    return (
      Buffer.from(salt, 'base64').length !== 16 ||
      Buffer.from(digest, 'base64').length !== 32 ||
      argon2.needsRehash(encodedHash, this.options)
    );
  }

  private isValidInput(password: string): boolean {
    return (
      typeof password === 'string' &&
      password.length > 0 &&
      Buffer.byteLength(password, 'utf8') <= MAX_PASSWORD_BYTES
    );
  }

  private isSupportedHash(encodedHash: string): boolean {
    if (typeof encodedHash !== 'string' || encodedHash.length > MAX_ENCODED_LENGTH) {
      return false;
    }

    const match = ARGON2ID_ENCODING.exec(encodedHash);
    if (!match?.[1] || match[0] !== encodedHash) return false;

    const parameters = new Map(
      match[1].split(',').map((entry) => {
        const [key, value] = entry.split('=');
        return [key, Number(value)] as const;
      }),
    );
    if (parameters.size !== 3) return false;
    const memoryCost = parameters.get('m') ?? 0;
    const timeCost = parameters.get('t') ?? 0;
    const parallelism = parameters.get('p') ?? 0;

    // Bound the work requested by stored PHC parameters before invoking native code.
    return (
      Number.isSafeInteger(memoryCost) &&
      Number.isSafeInteger(timeCost) &&
      Number.isSafeInteger(parallelism) &&
      parallelism <= MAX_PARALLELISM &&
      memoryCost >= 8 * parallelism &&
      memoryCost <= MAX_MEMORY_COST &&
      timeCost <= MAX_TIME_COST
    );
  }

  private readCost(
    config: ConfigService,
    key: string,
    fallback: number,
    minimum: number,
    maximum: number,
  ): number {
    const raw = config.get<unknown>(key);
    const value = raw === undefined ? fallback : typeof raw === 'string' ? Number(raw) : raw;
    if (
      typeof value !== 'number' ||
      !Number.isSafeInteger(value) ||
      value < minimum ||
      value > maximum
    ) {
      throw new RangeError(`${key} must be an integer between ${minimum} and ${maximum}.`);
    }
    return value;
  }
}
