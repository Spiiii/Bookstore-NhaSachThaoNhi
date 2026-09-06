import { BadRequestException } from '@nestjs/common';

/** Walk chunk boundaries, never search arbitrary compressed image bytes for chunk names. */
export function assertStaticPng(bytes: Buffer): void {
  let offset = 8;
  while (offset < bytes.length) {
    if (bytes.length - offset < 12) throw new BadRequestException('Malformed PNG chunk.');
    const length = bytes.readUInt32BE(offset);
    if (length > bytes.length - offset - 12) throw new BadRequestException('Truncated PNG chunk.');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === 'acTL' || type === 'fcTL' || type === 'fdAT')
      throw new BadRequestException('Animated PNG is not supported.');
    offset += length + 12;
    if (type === 'IEND') {
      if (length !== 0) throw new BadRequestException('Invalid PNG terminator.');
      return;
    }
  }
  throw new BadRequestException('PNG terminator is missing.');
}
