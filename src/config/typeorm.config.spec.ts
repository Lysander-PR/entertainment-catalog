jest.mock('./envs', () => ({
  envs: {
    DB_HOST: 'localhost',
    DB_PORT: 5432,
    DB_USER: 'postgres',
    DB_PASSWORD: 'secret',
    DB_NAME: 'entertainments',
  },
  isProd: false,
}));

import { AppDataSource } from './typeorm.config';

describe('AppDataSource', () => {
  it('should use postgres as the database type', () => {
    expect(AppDataSource.options.type).toBe('postgres');
  });

  it('should use the configured host, port and database name', () => {
    expect(AppDataSource.options.host).toBe('localhost');
    expect(AppDataSource.options.port).toBe(5432);
    expect(AppDataSource.options.database).toBe('entertainments');
  });

  it('should not run migrations automatically', () => {
    expect(AppDataSource.options.migrationsRun).toBe(false);
  });

  it('should not enable ssl outside production', () => {
    expect(AppDataSource.options.ssl).toBe(false);
  });
});
