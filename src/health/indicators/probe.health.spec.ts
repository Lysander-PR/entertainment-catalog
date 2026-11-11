import { Test, TestingModule } from '@nestjs/testing';
import { HealthIndicatorService } from '@nestjs/terminus';

import { ProbeHealthIndicator } from './probe.health';

// Exposes the private method so the test can spy on it.
type ProbeHealthIndicatorInternals = {
  runProbeWithTimeout: (
    key: string,
    probe: () => Promise<unknown>,
    timeoutMs: number,
  ) => Promise<void>;
};

describe('ProbeHealthIndicator', () => {
  let indicator: ProbeHealthIndicator;
  let healthIndicatorService: HealthIndicatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProbeHealthIndicator, HealthIndicatorService],
    }).compile();

    indicator = module.get<ProbeHealthIndicator>(ProbeHealthIndicator);
    healthIndicatorService = module.get<HealthIndicatorService>(
      HealthIndicatorService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  it('should mark the dependency as up when the probe responds', async () => {
    const probe = jest.fn().mockResolvedValue('PONG');

    const result = await indicator.pingCheck('cache', probe, 1000);

    expect(probe).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ cache: { status: 'up' } });
  });

  it('should create the indicator session with the dependency key', async () => {
    const checkSpy = jest.spyOn(healthIndicatorService, 'check');

    await indicator.pingCheck(
      'cache',
      jest.fn().mockResolvedValue(undefined),
      1000,
    );

    expect(checkSpy).toHaveBeenCalledWith('cache');
  });

  it('should run the probe through runProbeWithTimeout using the dependency key and timeout', async () => {
    const runProbeSpy = jest.spyOn(
      indicator as unknown as ProbeHealthIndicatorInternals,
      'runProbeWithTimeout',
    );
    const probe = jest.fn().mockResolvedValue(undefined);

    await indicator.pingCheck('storage', probe, 3000);

    expect(runProbeSpy).toHaveBeenCalledTimes(1);
    expect(runProbeSpy).toHaveBeenCalledWith('storage', probe, 3000);
  });

  it('should mark the dependency as down with the error message when the probe fails', async () => {
    const probe = jest.fn().mockRejectedValue(new Error('connection refused'));

    const result = await indicator.pingCheck('cache', probe, 1000);

    expect(result).toEqual({
      cache: { status: 'down', message: 'connection refused' },
    });
  });

  it('should convert the reason to a string when the probe rejects with a non-Error value', async () => {
    const probe = jest.fn().mockRejectedValue('unexpected failure');

    const result = await indicator.pingCheck('storage', probe, 1000);

    expect(result).toEqual({
      storage: { status: 'down', message: 'unexpected failure' },
    });
  });

  it('should mark the dependency as down when the probe exceeds the timeout', async () => {
    jest.useFakeTimers();
    const probe = jest.fn().mockReturnValue(new Promise(() => undefined));

    const pending = indicator.pingCheck('storage', probe, 3000);
    await jest.advanceTimersByTimeAsync(3000);

    await expect(pending).resolves.toEqual({
      storage: {
        status: 'down',
        message: 'storage health check timed out after 3000ms',
      },
    });
  });

  it('should not mark the dependency as down before the timeout is reached', async () => {
    jest.useFakeTimers();
    let settled = false;
    const probe = jest.fn().mockReturnValue(new Promise(() => undefined));

    const pending = indicator.pingCheck('cache', probe, 1000).then((result) => {
      settled = true;
      return result;
    });
    await jest.advanceTimersByTimeAsync(999);

    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);

    await expect(pending).resolves.toEqual({
      cache: {
        status: 'down',
        message: 'cache health check timed out after 1000ms',
      },
    });
    expect(settled).toBe(true);
  });

  it('should clear the timer when the probe responds before the timeout', async () => {
    jest.useFakeTimers();

    await indicator.pingCheck(
      'cache',
      jest.fn().mockResolvedValue('PONG'),
      1000,
    );

    expect(jest.getTimerCount()).toBe(0);
  });

  it('should clear the timer when the probe fails before the timeout', async () => {
    jest.useFakeTimers();

    await indicator.pingCheck(
      'cache',
      jest.fn().mockRejectedValue(new Error('connection refused')),
      1000,
    );

    expect(jest.getTimerCount()).toBe(0);
  });
});
