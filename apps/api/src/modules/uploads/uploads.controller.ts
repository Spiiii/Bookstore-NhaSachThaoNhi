import { Controller, Header, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CurrentAdmin } from '../security/decorators/current-admin.decorator';
import { Roles } from '../security/decorators/roles.decorator';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import { UploadResponseDto } from './uploads.response';
import { UploadsService } from './uploads.service';
import { UploadAdmissionInterceptor } from './upload-admission.interceptor';

@ApiTags('admin-uploads')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}
  @Post()
  @Header('Cache-Control', 'no-store')
  @UseInterceptors(UploadAdmissionInterceptor, FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: UploadResponseDto })
  upload(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.uploads.upload(admin, file);
  }
}
