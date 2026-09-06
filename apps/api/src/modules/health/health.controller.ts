import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../security/decorators/public.decorator';
import { HealthResponseDto } from './health.response';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('live')
  @ApiOkResponse({ type: HealthResponseDto })
  liveness(): HealthResponseDto {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ description: 'Primary database is unavailable.' })
  readiness(): Promise<HealthResponseDto> {
    return this.health.readiness();
  }
}
