/* eslint-disable @typescript-eslint/unbound-method */
import { ServiceUnavailableException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckResult } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthStatus } from './types/enums/health-status.enum';
import { JwtAuthGuard } from '@/auth/guards/auth.guard';
import { META_ROLES } from '@/auth/types/consts/meta-roles.const';
import { NO_CACHE_KEY } from '@/common/decorators/no-cache.decorator';
import { Roles } from '@/user/types/enums/roles.enum';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const healthyResult: HealthCheckResult = {
    status: 'ok',
    info: { database: { status: 'up' } },
    error: {},
    details: { database: { status: 'up' } },
  };

  beforeEach(async () => {
    const serviceMock = {
      getLiveness: jest.fn(),
      checkReadiness: jest.fn(),
      checkDependencies: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: serviceMock }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the liveness status of the service', () => {
    jest.spyOn(service, 'getLiveness').mockReturnValue({
      status: HealthStatus.OK,
    });

    const result = controller.live();

    expect(service.getLiveness).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: HealthStatus.OK });
  });

  it('should return the readiness status of the service', async () => {
    jest.spyOn(service, 'checkReadiness').mockResolvedValue({
      status: HealthStatus.OK,
    });

    const result = await controller.ready();

    expect(service.checkReadiness).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: HealthStatus.OK });
  });

  it('should propagate the ServiceUnavailableException from readiness', async () => {
    const error = new ServiceUnavailableException({
      status: HealthStatus.ERROR,
    });
    jest.spyOn(service, 'checkReadiness').mockRejectedValue(error);

    await expect(controller.ready()).rejects.toBe(error);
  });

  it('should return the dependency details', async () => {
    jest.spyOn(service, 'checkDependencies').mockResolvedValue(healthyResult);

    const result = await controller.details();

    expect(service.checkDependencies).toHaveBeenCalledTimes(1);
    expect(result).toBe(healthyResult);
  });

  it('should protect the details with JwtAuthGuard and the ADMIN role', () => {
    const handler = HealthController.prototype.details;

    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(
      JwtAuthGuard,
    );
    expect(Reflect.getMetadata(META_ROLES, handler)).toEqual([Roles.ADMIN]);
  });

  it('should keep liveness and readiness as public endpoints', () => {
    const { live, ready } = HealthController.prototype;

    expect(Reflect.getMetadata(GUARDS_METADATA, live)).toBeUndefined();
    expect(Reflect.getMetadata(GUARDS_METADATA, ready)).toBeUndefined();
    expect(
      Reflect.getMetadata(GUARDS_METADATA, HealthController),
    ).toBeUndefined();
  });

  it('should exclude the whole controller from the global cache', () => {
    expect(Reflect.getMetadata(NO_CACHE_KEY, HealthController)).toBe(true);
  });
});
