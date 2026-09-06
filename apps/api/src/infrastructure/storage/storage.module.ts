import { Module, type DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryStorageAdapter } from './adapters/cloudinary-storage.adapter';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { STORAGE_ADAPTER } from './storage-adapter.interface';

const storageProvider = {
  provide: STORAGE_ADAPTER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const provider = (config.get<string>('STORAGE_PROVIDER') ?? 'local').trim().toLowerCase();
    if (provider === 'local') return new LocalStorageAdapter(config);
    if (provider === 'cloudinary') return new CloudinaryStorageAdapter(config);
    throw new TypeError('STORAGE_PROVIDER must be either local or cloudinary.');
  },
};

@Module({
  imports: [ConfigModule],
  providers: [storageProvider],
  exports: [STORAGE_ADAPTER],
})
export class StorageModule {
  /** Filesystem settings can be supplied asynchronously without making the module global. */
  static withConfig(config: ConfigService | Promise<ConfigService>): DynamicModule {
    return {
      module: StorageModule,
      providers: [{ provide: ConfigService, useFactory: () => config }],
    };
  }
}
