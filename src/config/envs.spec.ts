/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-require-imports */
// envs.ts reads process.env as soon as it is imported, so to test it with
// different values we reload it fresh in every test using require() instead
// of a normal import. jest.resetModules() forces that fresh reload.

describe('envs', () => {
  const validEnv = {
    NODE_ENV: 'test',
    PORT: '3000',
    DB_PORT: '5432',
    DB_HOST: 'localhost',
    DB_USER: 'postgres',
    DB_PASSWORD: 'secret',
    DB_NAME: 'entertainments',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    SUPABASE_BUCKET: 'test-bucket',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret',
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...validEnv };
  });

  it('should expose the environment variables', () => {
    const { envs } = require('./envs');

    expect(envs.DB_HOST).toBe('localhost');
    expect(envs.JWT_SECRET).toBe('test-secret');
  });

  it('should convert PORT into a number', () => {
    const { envs } = require('./envs');

    expect(envs.PORT).toBe(3000);
  });

  it('should throw an error when a required variable is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => require('./envs')).toThrow('Config validation error');
  });

  it('should set isProd to false when NODE_ENV is not "prod"', () => {
    const { isProd } = require('./envs');

    expect(isProd).toBe(false);
  });

  it('should set isProd to true when NODE_ENV is "prod"', () => {
    process.env.NODE_ENV = 'prod';

    const { isProd } = require('./envs');

    expect(isProd).toBe(true);
  });
});
