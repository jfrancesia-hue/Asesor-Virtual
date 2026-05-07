import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns service health metadata', () => {
    const controller = new HealthController();

    const result = controller.check();

    expect(result.status).toBe('ok');
    // Lee package.json en runtime — solo verificamos que no estén vacíos.
    expect(typeof result.service).toBe('string');
    expect(result.service.length).toBeGreaterThan(0);
    expect(typeof result.version).toBe('string');
    expect(result.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(result.timestamp).toEqual(expect.any(String));
    expect(result.uptime).toEqual(expect.any(Number));
  });
});
