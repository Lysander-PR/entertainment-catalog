import { SetMetadata } from '@nestjs/common';

export const NO_CACHE_KEY = 'noCache';

/**
 * Excludes a handler (or every handler of a controller) from the global
 * HttpCacheInterceptor, so its response is always computed on each request.
 */
export function NoCache() {
  return SetMetadata(NO_CACHE_KEY, true);
}
