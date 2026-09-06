import { ApiProperty } from '@nestjs/swagger';
import { IMAGE_MIMES } from './upload.policy';

export class UploadResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Use as storageKey, imageKey, coverKey or logoKey in the owning content API',
  })
  storageKey!: string;
  @ApiProperty({ description: 'Stored sanitized image size in bytes' }) size!: number;
  @ApiProperty({ enum: [...IMAGE_MIMES] }) mimeType!: string;
  @ApiProperty() width!: number;
  @ApiProperty() height!: number;
}
