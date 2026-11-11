import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

@Injectable()
export class CacheService {
  private readonly scanBatchSize = 1000;

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async ping(): Promise<void> {
    const redisStore = this.findRedisStore();

    if (!redisStore) {
      throw new Error('Redis store is not configured');
    }

    const client = await redisStore.getClient();
    await client.ping();
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const redisStore = this.findRedisStore();

    if (!redisStore) {
      return;
    }

    const client = await redisStore.getClient();
    let cursor = '0';

    do {
      const result = await client.scan(cursor, {
        MATCH: `${prefix}*`,
        COUNT: this.scanBatchSize,
        TYPE: 'string',
      });

      cursor = result.cursor.toString();

      if (result.keys.length > 0) {
        await client.unlink(result.keys);
      }
    } while (cursor !== '0');
  }

  private findRedisStore(): KeyvRedis<unknown> | undefined {
    return this.cacheManager.stores
      .map((keyv): unknown => keyv.store)
      .find((store): store is KeyvRedis<unknown> => store instanceof KeyvRedis);
  }
}
