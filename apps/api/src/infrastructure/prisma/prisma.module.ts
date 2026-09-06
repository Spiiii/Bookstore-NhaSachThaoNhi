import { Module, type DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {
  /** Await an explicit validated snapshot instead of racing a sibling async config loader. */
  static withConfig(config: ConfigService | Promise<ConfigService>): DynamicModule {
    return {
      module: PrismaModule,
      providers: [{ provide: ConfigService, useFactory: () => config }],
    };
  }
}
