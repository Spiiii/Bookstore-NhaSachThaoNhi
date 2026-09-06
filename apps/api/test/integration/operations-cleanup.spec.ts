import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { OperationalModule } from '../../operations/operational.module';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';

describe('Operational resource cleanup on failure', () => {
  const config = new ConfigService({ DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test' });
  afterEach(() => jest.restoreAllMocks());

  it('disconnects after a failed connection and preserves the original failure', async () => {
    const resource = new PrismaService(config);
    const original = new Error('connection failed');
    jest.spyOn(resource, '$connect').mockRejectedValue(original);
    const close = jest.spyOn(resource, '$disconnect').mockResolvedValue();
    await expect(resource.onModuleInit()).rejects.toBe(original);
    await resource.onModuleDestroy();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('keeps Prisma reachable when a different initialization hook fails', async () => {
    const resources = new Set<PrismaService>();
    jest.spyOn(PrismaService.prototype, 'onModuleInit').mockResolvedValue();
    const close = jest.spyOn(PrismaService.prototype, 'close').mockResolvedValue();
    const module = await Test.createTestingModule({
      imports: [OperationalModule.withResources((r) => resources.add(r))],
    })
      .overrideProvider(ConfigService)
      .useValue(config)
      .overrideProvider(PasswordService)
      .useValue({
        onModuleInit: () => {
          throw new Error('later hook failed');
        },
      })
      .compile();
    await expect(module.init()).rejects.toThrow('later hook failed');
    expect(resources.size).toBe(1);
    await Promise.all([...resources].map((r) => r.close()));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('retains initialization failure even when disconnect also fails', async () => {
    const resource = new PrismaService(config);
    const original = new Error('initialization failed');
    jest.spyOn(resource, '$connect').mockRejectedValue(original);
    jest.spyOn(resource, '$disconnect').mockRejectedValue(new Error('cleanup failed'));
    await expect(resource.onModuleInit()).rejects.toBe(original);
    await expect(resource.close()).rejects.toThrow('cleanup failed');
  });
});
