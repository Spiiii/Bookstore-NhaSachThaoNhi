import { createDocument } from '../../src/openapi/create-document';
import { configureApplication } from '../../src/bootstrap/configure-application';
import { offlineAppBuilder } from '../../tooling/openapi/offline-providers';
import { exportDocument } from '../../tooling/openapi/export-document';

describe('Runtime/offline OpenAPI parity', () => {
  it('uses the same configured application metadata at runtime and offline', async () => {
    const module = await offlineAppBuilder().compile();
    const app = module.createNestApplication({ logger: false });
    try {
      configureApplication(app);
      expect(createDocument(app)).toEqual(JSON.parse(await exportDocument()));
    } finally {
      await app.close();
    }
  });
});
