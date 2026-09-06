import { Module, type DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { STORAGE_ADAPTER } from './storage-adapter.interface';

@Module({
  imports: [ConfigModule],
  providers: [LocalStorageAdapter, { provide: STORAGE_ADAPTER, useExisting: LocalStorageAdapter }],
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
