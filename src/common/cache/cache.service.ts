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

  async deleteByPrefix(prefix: string): Promise<void> {
    const redisStore = this.cacheManager.stores
      .map((keyv): unknown => keyv.store)
      .find((store): store is KeyvRedis<unknown> => store instanceof KeyvRedis);

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
}
