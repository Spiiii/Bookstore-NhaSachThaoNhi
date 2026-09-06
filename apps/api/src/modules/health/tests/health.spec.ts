import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from '../health.controller';
import { HealthService } from '../health.service';

describe('HealthModule', () => {
  it('reports liveness without touching the database', () => {
    const query = jest.fn();
    const service = new HealthService({ $queryRaw: query } as never);
    expect(new HealthController(service).liveness()).toEqual({ status: 'ok' });
    expect(query).not.toHaveBeenCalled();
  });

  it('reports readiness only when the primary database responds', async () => {
    const ready = new HealthService({ $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as never);
    await expect(ready.readiness()).resolves.toEqual({ status: 'ok' });
    const unavailable = new HealthService({ $queryRaw: jest.fn().mockRejectedValue(new Error('private')) } as never);
    await expect(unavailable.readiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
