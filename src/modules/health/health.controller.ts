import { Public } from '../../common/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return {
      success: true,
      api: 'health',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
