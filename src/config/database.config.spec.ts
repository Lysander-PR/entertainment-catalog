/* eslint-disable @typescript-eslint/no-require-imports */
describe('databaseConfig', () => {
  let databaseConfig: any;

  beforeAll(() => {
    jest.doMock('./envs', () => ({
      envs: {
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_USER: 'postgres',
        DB_PASSWORD: 'secret',
        DB_NAME: 'entertainments',
      },
      isProd: false,
    }));

    databaseConfig = require('./database.config').databaseConfig;
  });

  it('should use postgres as the database type', () => {
    expect(databaseConfig.type).toBe('postgres');
  });

  it('should use the configured host and port', () => {
    expect(databaseConfig.host).toBe('localhost');
    expect(databaseConfig.port).toBe(5432);
  });

  it('should use the configured credentials and database name', () => {
    expect(databaseConfig.username).toBe('postgres');
    expect(databaseConfig.password).toBe('secret');
    expect(databaseConfig.database).toBe('entertainments');
  });

  it('should not enable ssl outside production', () => {
    expect(databaseConfig.ssl).toBe(false);
  });
});

describe('databaseConfig in production', () => {
  it('should enable ssl', () => {
    jest.resetModules();
    jest.doMock('./envs', () => ({
      envs: {
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_USER: 'postgres',
        DB_PASSWORD: 'secret',
        DB_NAME: 'entertainments',
      },
      isProd: true,
    }));

    const { databaseConfig } = require('./database.config');

    expect(databaseConfig.ssl).toBe(true);
    expect(databaseConfig.extra.ssl).toEqual({ rejectUnauthorized: true });
  });
});
