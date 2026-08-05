import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import KeyvRedis, { RedisClientConnectionType } from '@keyv/redis';

import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let redisStore: KeyvRedis<unknown>;
  let client: { scan: jest.Mock; unlink: jest.Mock };

  const prefix = '/api/albums';
  const scanOptions = { MATCH: `${prefix}*`, COUNT: 1000, TYPE: 'string' };

  const createService = async (stores: unknown[]): Promise<CacheService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: CACHE_MANAGER, useValue: { stores } },
      ],
    }).compile();

    return module.get<CacheService>(CacheService);
  };

  beforeEach(async () => {
    client = { scan: jest.fn(), unlink: jest.fn() };
    redisStore = new KeyvRedis('redis://localhost:6379');

    jest
      .spyOn(redisStore, 'getClient')
      .mockResolvedValue(client as unknown as RedisClientConnectionType);

    service = await createService([{ store: redisStore }]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should scan by prefix and unlink the matching keys', async () => {
    const keys = [prefix, `${prefix}?limit=10&offset=0`, `${prefix}/uuid-1`];
    client.scan.mockResolvedValue({ cursor: 0, keys });

    await service.deleteByPrefix(prefix);

    expect(client.scan).toHaveBeenCalledTimes(1);
    expect(client.scan).toHaveBeenCalledWith('0', scanOptions);
    expect(client.unlink).toHaveBeenCalledTimes(1);
    expect(client.unlink).toHaveBeenCalledWith(keys);
  });

  it('should keep scanning until the cursor returns to zero', async () => {
    client.scan
      .mockResolvedValueOnce({ cursor: 42, keys: [`${prefix}?page=1`] })
      .mockResolvedValueOnce({ cursor: 0, keys: [`${prefix}?page=2`] });

    await service.deleteByPrefix(prefix);

    expect(client.scan).toHaveBeenCalledTimes(2);
    expect(client.scan).toHaveBeenNthCalledWith(1, '0', scanOptions);
    expect(client.scan).toHaveBeenNthCalledWith(2, '42', scanOptions);
    expect(client.unlink).toHaveBeenNthCalledWith(1, [`${prefix}?page=1`]);
    expect(client.unlink).toHaveBeenNthCalledWith(2, [`${prefix}?page=2`]);
  });

  it('should not unlink anything when the batch has no matching keys', async () => {
    client.scan.mockResolvedValue({ cursor: 0, keys: [] });

    await service.deleteByPrefix(prefix);

    expect(client.scan).toHaveBeenCalledTimes(1);
    expect(client.unlink).not.toHaveBeenCalled();
  });

  it('should skip empty batches without stopping the scan', async () => {
    client.scan
      .mockResolvedValueOnce({ cursor: 42, keys: [] })
      .mockResolvedValueOnce({ cursor: 0, keys: [`${prefix}?page=2`] });

    await service.deleteByPrefix(prefix);

    expect(client.scan).toHaveBeenCalledTimes(2);
    expect(client.unlink).toHaveBeenCalledTimes(1);
    expect(client.unlink).toHaveBeenCalledWith([`${prefix}?page=2`]);
  });

  it('should use the redis store when other stores are configured', async () => {
    client.scan.mockResolvedValue({ cursor: 0, keys: [prefix] });
    service = await createService([
      { store: new Map() },
      { store: redisStore },
    ]);

    await service.deleteByPrefix(prefix);

    expect(client.unlink).toHaveBeenCalledWith([prefix]);
  });

  it('should do nothing when there is no redis store configured', async () => {
    service = await createService([{ store: new Map() }]);

    await expect(service.deleteByPrefix(prefix)).resolves.toBeUndefined();

    expect(client.scan).not.toHaveBeenCalled();
    expect(client.unlink).not.toHaveBeenCalled();
  });
});
