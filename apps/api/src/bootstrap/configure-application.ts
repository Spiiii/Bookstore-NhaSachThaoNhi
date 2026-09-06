import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { createDocument } from '../openapi/create-document';

function exactOrigins(config: ConfigService): string[] {
  const raw = config.getOrThrow<string>('AUTH_ALLOWED_ORIGINS');
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('AUTH_ALLOWED_ORIGINS is required.');
  return raw.split(',').map((entry) => {
    const origin = entry.trim();
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw new Error('AUTH_ALLOWED_ORIGINS contains an invalid origin.');
    }
    if (
      url.origin !== origin ||
      !['https:', 'http:'].includes(url.protocol) ||
      (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    ) {
      throw new Error('AUTH_ALLOWED_ORIGINS requires exact HTTPS origins (HTTP loopback only).');
    }
    return origin;
  });
}

export function readRuntimePort(environment: NodeJS.ProcessEnv = process.env): number {
  const raw = environment.PORT ?? '3001';
  const port = Number(raw);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535.');
  }
  return port;
}

export function configureApplication(app: INestApplication): void {
  const config = app.get(ConfigService);
  const origins = new Set(exactOrigins(config));
  app.enableCors({
    credentials: true,
    origin(origin, callback) {
      if (origin === undefined || origins.has(origin)) callback(null, true);
      else callback(new Error('Origin is not allowed.'));
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false, value: false },
    }),
  );
  const proxies = config.get<string>('TRUSTED_PROXIES')?.trim();
  if (proxies) {
    const values = proxies.split(',').map((entry) => entry.trim()).filter(Boolean);
    if (values.length === 0 || values.includes('*')) throw new Error('TRUSTED_PROXIES must be explicit.');
    const instance = app.getHttpAdapter().getInstance() as { set(name: string, value: unknown): void };
    instance.set('trust proxy', values);
  }
  app.enableShutdownHooks();
  if (config.get<string>('SWAGGER_ENABLED') === 'true') {
    SwaggerModule.setup('docs', app, createDocument(app));
  }
}
