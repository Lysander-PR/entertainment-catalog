import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

@Injectable()
export class ProbeHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async pingCheck<Key extends string>(
    key: Key,
    probe: () => Promise<unknown>,
    timeoutMs: number,
  ): Promise<HealthIndicatorResult<Key>> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.runProbeWithTimeout(key, probe, timeoutMs);
      return indicator.up();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return indicator.down({ message });
    }
  }

  private async runProbeWithTimeout(
    key: string,
    probe: () => Promise<unknown>,
    timeoutMs: number,
  ): Promise<void> {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(`${key} health check timed out after ${timeoutMs}ms`),
          ),
        timeoutMs,
      );
    });

    try {
      await Promise.race([probe(), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
