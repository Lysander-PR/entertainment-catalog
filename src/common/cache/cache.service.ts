/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async deleteByPrefix(prefix: string): Promise<void> {
    const allStores = this.cacheManager.stores;

    const redisStore = allStores.find(
      (store) => store.store instanceof KeyvRedis,
    );

    if (redisStore) {
      const store = redisStore.store;

      const iterator = store.iterator();
      for await (const [key] of iterator) {
        if (key.startsWith(prefix)) {
          this.logger.log(`Key ${key}, Value ${await store.get(key)}`);
          await redisStore.delete(key);
        }
      }
    }
  }
}
