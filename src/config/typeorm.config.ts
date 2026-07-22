import { DataSource } from 'typeorm';
import { envs, isProd } from './envs';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: envs.DB_HOST,
  port: envs.DB_PORT,
  username: envs.DB_USER,
  password: envs.DB_PASSWORD,
  database: envs.DB_NAME,
  synchronize: false,
  entities: ['**/*.entity.ts'],
  migrations: ['src/database/migrations/*-migration.ts'],
  migrationsRun: false,
  logging: true,
  ssl: isProd,
  extra: {
    ssl: isProd ? { rejectUnauthorized: true } : null,
  },
});
