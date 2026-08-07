import { DataSource } from 'typeorm';
import { envs } from './envs';

const configDir = __dirname.replace(/\\/g, '/');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: envs.DB_HOST,
  port: envs.DB_PORT,
  username: envs.DB_USER,
  password: envs.DB_PASSWORD,
  database: envs.DB_NAME,
  synchronize: false,
  entities: [`${configDir}/../**/*.entity.{ts,js}`],
  migrations: [`${configDir}/../database/migrations/*-migration.{ts,js}`],
  migrationsRun: false,
  logging: true,
  ssl: false,
});
