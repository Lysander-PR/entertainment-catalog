import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { HealthService } from './health.service';
import { HealthStatusResponseDto } from './dto/health-status-response.dto';
import { Auth } from '@/auth/decorator/auth.decorator';
import { NoCache } from '@/common/decorators/no-cache.decorator';
import { Roles } from '@/user/types/enums/roles.enum';

@ApiTags('Health')
@Controller('health')
@NoCache()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe: the process is up and serving requests',
  })
  @ApiOkResponse({
    description: 'The API process is alive',
    type: HealthStatusResponseDto,
  })
  live(): HealthStatusResponseDto {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe: every dependency is reachable',
  })
  @ApiOkResponse({
    description: 'The API and all of its dependencies are healthy',
    type: HealthStatusResponseDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'At least one dependency is unhealthy',
    type: HealthStatusResponseDto,
  })
  ready(): Promise<HealthStatusResponseDto> {
    return this.healthService.checkReadiness();
  }

  @Get('details')
  @HealthCheck()
  @Auth(Roles.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Detailed status of every dependency (admin only)',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiForbiddenResponse({ description: 'User is not an admin' })
  details() {
    return this.healthService.checkDependencies();
  }
}
