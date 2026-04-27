import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns service health metadata', () => {
    const controller = new HealthController();

    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('tuasesor-api');
    expect(result.version).toBe('1.0.0');
    expect(result.timestamp).toEqual(expect.any(String));
    expect(result.uptime).toEqual(expect.any(Number));
  });
});
