import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorFunction,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { HealthService } from './health.service';
import { ProbeHealthIndicator } from './indicators/probe.health';
import { CacheService } from '@/common/cache/cache.service';
import { STORAGE_SERVICE } from '@/common/interfaces/storage.interface';
import { HealthStatus } from './types/enums/health-status.enum';

describe('HealthService', () => {
  let service: HealthService;
  let healthCheckService: { check: jest.Mock };
  let typeOrmHealthIndicator: { pingCheck: jest.Mock };
  let probeHealthIndicator: { pingCheck: jest.Mock };
  let cacheService: { ping: jest.Mock };
  let storageService: { ping: jest.Mock };

  const healthyResult: HealthCheckResult = {
    status: 'ok',
    info: {
      database: { status: 'up' },
      cache: { status: 'up' },
      storage: { status: 'up' },
    },
    error: {},
    details: {
      database: { status: 'up' },
      cache: { status: 'up' },
      storage: { status: 'up' },
    },
  };

  const unhealthyResult: HealthCheckResult = {
    status: 'error',
    info: { database: { status: 'up' }, cache: { status: 'up' } },
    error: { storage: { status: 'down', message: 'Bucket not found' } },
    details: {
      database: { status: 'up' },
      cache: { status: 'up' },
      storage: { status: 'down', message: 'Bucket not found' },
    },
  };

  // Runs every indicator like Terminus does, so the probes get executed.
  const runIndicators = async (indicators: HealthIndicatorFunction[]) => {
    await Promise.all(
      indicators.map((indicator) => Promise.resolve(indicator())),
    );
    return healthyResult;
  };

  beforeEach(async () => {
    healthCheckService = { check: jest.fn() };
    typeOrmHealthIndicator = { pingCheck: jest.fn() };
    probeHealthIndicator = { pingCheck: jest.fn() };
    cacheService = { ping: jest.fn() };
    storageService = { ping: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: HealthCheckService, useValue: healthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: typeOrmHealthIndicator },
        { provide: ProbeHealthIndicator, useValue: probeHealthIndicator },
        { provide: CacheService, useValue: cacheService },
        { provide: STORAGE_SERVICE, useValue: storageService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLiveness', () => {
    it('should respond ok without checking the dependencies', () => {
      const result = service.getLiveness();

      expect(result).toEqual({ status: HealthStatus.OK });
      expect(healthCheckService.check).not.toHaveBeenCalled();
    });
  });

  describe('checkDependencies', () => {
    it('should run one check per dependency and return the Terminus result', async () => {
      healthCheckService.check.mockImplementation(runIndicators);

      const result = await service.checkDependencies();

      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      expect(healthCheckService.check.mock.calls[0][0]).toHaveLength(3);
      expect(result).toBe(healthyResult);
    });

    it('should ping the database with its timeout', async () => {
      healthCheckService.check.mockImplementation(runIndicators);

      await service.checkDependencies();

      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'database',
        { timeout: 1000 },
      );
    });

    it('should check the cache and the storage with their keys and timeouts', async () => {
      healthCheckService.check.mockImplementation(runIndicators);

      await service.checkDependencies();

      expect(probeHealthIndicator.pingCheck).toHaveBeenCalledTimes(2);
      expect(probeHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'cache',
        expect.any(Function),
        1000,
      );
      expect(probeHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'storage',
        expect.any(Function),
        3000,
      );
    });

    it('should use the CacheService and storage service pings as probes', async () => {
      healthCheckService.check.mockImplementation(runIndicators);

      await service.checkDependencies();

      const probes = probeHealthIndicator.pingCheck.mock.calls.map(
        ([, probe]) => probe as () => Promise<void>,
      );
      await Promise.all(probes.map((probe) => probe()));

      expect(cacheService.ping).toHaveBeenCalledTimes(1);
      expect(storageService.ping).toHaveBeenCalledTimes(1);
    });

    it('should propagate the ServiceUnavailableException with the details when a dependency fails', async () => {
      const error = new ServiceUnavailableException(unhealthyResult);
      healthCheckService.check.mockRejectedValue(error);

      await expect(service.checkDependencies()).rejects.toBe(error);
    });
  });

  describe('checkReadiness', () => {
    it('should respond ok when all dependencies are healthy', async () => {
      healthCheckService.check.mockResolvedValue(healthyResult);

      const result = await service.checkReadiness();

      expect(healthCheckService.check).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ status: HealthStatus.OK });
    });

    it('should throw ServiceUnavailableException with only the overall status when a dependency fails', async () => {
      healthCheckService.check.mockRejectedValue(
        new ServiceUnavailableException(unhealthyResult),
      );

      const error = await service.checkReadiness().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toEqual({
        status: HealthStatus.ERROR,
      });
    });

    it('should propagate unexpected errors unchanged', async () => {
      const error = new Error('unexpected');
      healthCheckService.check.mockRejectedValue(error);

      await expect(service.checkReadiness()).rejects.toBe(error);
    });
  });
});
