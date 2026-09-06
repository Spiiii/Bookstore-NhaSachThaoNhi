import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

/** Shared runtime/tooling definition. API mount prefixes belong to the deployment server URL. */
export function createDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Bookstore API')
    .setDescription('Product catalogue and singleton-admin content APIs.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .addCookieAuth(
      '__Secure-bookstore-refresh',
      { type: 'apiKey', in: 'cookie' },
      '__Secure-bookstore-refresh',
    )
    .build();
  return SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: true,
    operationIdFactory: (controller, method) => `${controller}_${method}`,
  });
}
