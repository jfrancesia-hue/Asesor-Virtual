import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Resuelve package.json contra el cwd del proceso. En desarrollo es
// `backend/` (cuando se corre `npm run start:dev`), en producción es
// `/app/` (Dockerfile copia el package.json ahí). Caching: lo leemos
// una vez al import y lo congelamos.
function loadPkg(): { name: string; version: string } {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8');
    const pkg = JSON.parse(raw);
    return { name: pkg.name ?? 'miasesor-backend', version: pkg.version ?? '0.0.0' };
  } catch {
    return { name: 'miasesor-backend', version: '0.0.0' };
  }
}
const PKG = loadPkg();

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: PKG.name,
      version: PKG.version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
