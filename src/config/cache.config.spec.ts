const mockStore = { id: 'mock-store' };
const mockCreateKeyv = jest.fn().mockReturnValue(mockStore);

jest.mock('@keyv/redis', () => ({
  createKeyv: mockCreateKeyv,
}));

jest.mock('./envs', () => ({
  envs: { REDIS_URL: 'redis://localhost:6379' },
}));

import { cacheConfig } from './cache.config';

describe('cacheConfig', () => {
  it('should set the cache ttl to 3 minutes', () => {
    expect(cacheConfig.ttl).toBe(3 * 60 * 1000);
  });

  it('should create the redis store using the configured REDIS_URL', () => {
    expect(mockCreateKeyv).toHaveBeenCalledWith('redis://localhost:6379', {
      connectionTimeout: 5000,
      throwOnConnectError: true,
    });
  });

  it('should include the created store in the cache stores', () => {
    expect(cacheConfig.stores).toContain(mockStore);
  });
});
