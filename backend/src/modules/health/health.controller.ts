import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Lee la versión real del package.json en build time así no queda
// hardcodeada cuando bumpeamos paquete pero olvidamos tocar este archivo.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../../package.json') as { name: string; version: string };

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: pkg.name,
      version: pkg.version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
