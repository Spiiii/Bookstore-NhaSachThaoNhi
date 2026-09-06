import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication, readRuntimePort } from './bootstrap/configure-application';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  try {
    configureApplication(app);
    await app.listen(readRuntimePort(), '0.0.0.0');
  } catch (error) {
    await app.close().catch(() => undefined);
    throw error;
  }
}

void bootstrap().catch(() => {
  process.stderr.write('API startup failed. Check runtime configuration and dependencies.\n');
  process.exitCode = 1;
});
