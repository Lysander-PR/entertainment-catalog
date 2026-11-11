import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { CacheService } from '@/common/cache/cache.service';
import {
  type IStorageService,
  STORAGE_SERVICE,
} from '@/common/interfaces/storage.interface';
import { ProbeHealthIndicator } from './indicators/probe.health';
import { HealthStatusResponseDto } from './dto/health-status-response.dto';
import { HealthStatus } from './types/enums/health-status.enum';

@Injectable()
export class HealthService {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
    private readonly probeHealthIndicator: ProbeHealthIndicator,
    private readonly cacheService: CacheService,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  getLiveness(): HealthStatusResponseDto {
    return { status: HealthStatus.OK };
  }

  async checkReadiness(): Promise<HealthStatusResponseDto> {
    try {
      await this.checkDependencies();
      return { status: HealthStatus.OK };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw new ServiceUnavailableException({ status: HealthStatus.ERROR });
      }
      throw error;
    }
  }

  checkDependencies(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([
      () =>
        this.typeOrmHealthIndicator.pingCheck('database', {
          timeout: 1000,
        }),
      () =>
        this.probeHealthIndicator.pingCheck(
          'cache',
          () => this.cacheService.ping(),
          1000,
        ),
      () =>
        this.probeHealthIndicator.pingCheck(
          'storage',
          () => this.storageService.ping(),
          3000,
        ),
    ]);
  }
}
