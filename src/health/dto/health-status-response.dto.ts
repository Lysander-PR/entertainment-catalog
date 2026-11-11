import { ApiProperty } from '@nestjs/swagger';

import { HealthStatus } from '../types/enums/health-status.enum';

export class HealthStatusResponseDto {
  @ApiProperty({
    enum: HealthStatus,
    example: HealthStatus.OK,
    description: 'Overall status, without per-dependency details',
  })
  status: HealthStatus;
}
