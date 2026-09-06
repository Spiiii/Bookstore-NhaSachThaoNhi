import { Controller, Get, Header } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../security/decorators/roles.decorator';
import { DashboardResponseDto } from './dashboard.response';
import { DashboardService } from './dashboard.service';

@ApiTags('admin-dashboard')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: DashboardResponseDto })
  summary() {
    return this.dashboard.summary();
  }
}
