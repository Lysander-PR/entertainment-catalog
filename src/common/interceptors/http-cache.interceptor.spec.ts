/* eslint-disable @typescript-eslint/unbound-method */
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';

import { HttpCacheInterceptor } from './http-cache.interceptor';
import { NoCache } from '@/common/decorators/no-cache.decorator';

class CachedController {
  find() {}

  @NoCache()
  live() {}
}

@NoCache()
class NoCacheController {
  details() {}
}

describe('HttpCacheInterceptor', () => {
  const url = '/api/test';

  let interceptor: HttpCacheInterceptor;
  let cacheManager: { get: jest.Mock; set: jest.Mock };
  let httpAdapter: {
    getRequestMethod: jest.Mock;
    getRequestUrl: jest.Mock;
    setHeader: jest.Mock;
  };
  let next: CallHandler;

  const createContext = (
    controller: abstract new (...args: never[]) => unknown,
    handler: () => void,
    method = 'GET',
  ): ExecutionContext => {
    const request = { method, url };

    return {
      getHandler: () => handler,
      getClass: () => controller,
      getArgByIndex: () => request,
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    cacheManager = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };
    httpAdapter = {
      getRequestMethod: jest.fn(),
      getRequestUrl: jest.fn().mockReturnValue(url),
      setHeader: jest.fn(),
    };
    next = { handle: jest.fn().mockReturnValue(of('response')) };

    interceptor = new HttpCacheInterceptor(cacheManager, new Reflector());
    Object.assign(interceptor, { httpAdapterHost: { httpAdapter } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should read from and write to the cache for GET requests without @NoCache()', async () => {
    const context = createContext(
      CachedController,
      CachedController.prototype.find,
    );

    const result$ = await interceptor.intercept(context, next);
    const result = await lastValueFrom(result$);

    expect(cacheManager.get).toHaveBeenCalledWith(url);
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(cacheManager.set).toHaveBeenCalledWith(url, 'response');
    expect(result).toBe('response');
  });

  it('should not use the cache when the handler has @NoCache()', async () => {
    const context = createContext(
      CachedController,
      CachedController.prototype.live,
    );

    const result$ = await interceptor.intercept(context, next);
    const result = await lastValueFrom(result$);

    expect(cacheManager.get).not.toHaveBeenCalled();
    expect(cacheManager.set).not.toHaveBeenCalled();
    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(result).toBe('response');
  });

  it('should not use the cache when the controller has @NoCache()', async () => {
    const context = createContext(
      NoCacheController,
      NoCacheController.prototype.details,
    );

    const result$ = await interceptor.intercept(context, next);
    await lastValueFrom(result$);

    expect(cacheManager.get).not.toHaveBeenCalled();
    expect(cacheManager.set).not.toHaveBeenCalled();
    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it('should not use the cache for non-GET requests', async () => {
    const context = createContext(
      CachedController,
      CachedController.prototype.find,
      'POST',
    );

    const result$ = await interceptor.intercept(context, next);
    await lastValueFrom(result$);

    expect(cacheManager.get).not.toHaveBeenCalled();
    expect(next.handle).toHaveBeenCalledTimes(1);
  });
});
