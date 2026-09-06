import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { SecurityModule } from '../security/security.module';
import { UsersModule } from '../users/users.module';
import { UploadPolicy } from './upload.policy';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { UploadAdmissionInterceptor } from './upload-admission.interceptor';

@Module({
  imports: [
    ConfigModule,
    StorageModule,
    SecurityModule,
    UsersModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new UploadPolicy(config).multerOptions(),
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadPolicy, UploadsService, UploadAdmissionInterceptor],
})
export class UploadsModule {}
