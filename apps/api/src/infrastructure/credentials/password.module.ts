import { Module, type DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';

@Module({
  imports: [ConfigModule],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {
  /** Share the same validated parameters across runtime, setup and recovery contexts. */
  static withConfig(config: ConfigService | Promise<ConfigService>): DynamicModule {
    return {
      module: PasswordModule,
      providers: [{ provide: ConfigService, useFactory: () => config }],
    };
  }
}
