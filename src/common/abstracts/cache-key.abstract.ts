import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';

export abstract class CacheKey {
  readonly cacheKey: string;

  constructor(folder: string) {
    this.cacheKey = `/${APP_PREFIX}/${folder}`;
  }
}
