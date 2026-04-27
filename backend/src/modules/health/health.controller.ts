import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'tuasesor-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
