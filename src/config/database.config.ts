import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { envs } from './envs';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envs.DB_HOST,
  port: envs.DB_PORT,
  username: envs.DB_USER,
  password: envs.DB_PASSWORD,
  database: envs.DB_NAME,
  autoLoadEntities: true,
  synchronize: true,
};
