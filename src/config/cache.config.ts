import { CacheModuleOptions } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { envs } from './envs';

export const cacheConfig: CacheModuleOptions = {
  ttl: 3 * 60 * 1000,
  stores: [
    createKeyv(envs.REDIS_URL, {
      connectionTimeout: 5000,
      throwOnConnectError: true,
      useUnlink: true,
    }),
  ],
};
