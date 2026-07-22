/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { MODULE_METADATA } from '@nestjs/common/constants';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';

jest.mock('@/config/envs', () => ({
  envs: {
    JWT_SECRET: 'test-secret',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    SUPABASE_BUCKET: 'test-bucket',
  },
  isProd: false,
}));

jest.mock('./config/database.config', () => ({
  databaseConfig: {},
}));

jest.mock('./config/cache.config', () => ({
  cacheConfig: {},
}));

import { AppModule } from './app.module';
import { BooksModule } from './books/books.module';
import { MoviesModule } from './movies/movies.module';
import { SongsModule } from './songs/songs.module';
import { FilesModule } from './files/files.module';
import { AlbumsModule } from './albums/albums.module';
import { GenresModule } from './genres/genres.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';

describe('AppModule', () => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule);
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule);

  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('should import BooksModule', () => {
    expect(imports).toContain(BooksModule);
  });

  it('should import MoviesModule', () => {
    expect(imports).toContain(MoviesModule);
  });

  it('should import SongsModule', () => {
    expect(imports).toContain(SongsModule);
  });

  it('should import FilesModule', () => {
    expect(imports).toContain(FilesModule);
  });

  it('should import AlbumsModule', () => {
    expect(imports).toContain(AlbumsModule);
  });

  it('should import GenresModule', () => {
    expect(imports).toContain(GenresModule);
  });

  it('should import CommonModule', () => {
    expect(imports).toContain(CommonModule);
  });

  it('should import SeedModule', () => {
    expect(imports).toContain(SeedModule);
  });

  it('should import UserModule', () => {
    expect(imports).toContain(UserModule);
  });

  it('should import AuthModule', () => {
    expect(imports).toContain(AuthModule);
  });

  it('should import TypeOrmModule for the database connection', () => {
    const typeOrmImport = imports.find((item) => item.module === TypeOrmModule);

    expect(typeOrmImport).toBeDefined();
  });

  it('should import CacheModule as a global module', () => {
    const cacheImport = imports.find((item) => item.module === CacheModule);

    expect(cacheImport).toBeDefined();
    expect(cacheImport.global).toBe(true);
  });

  it('should register CacheInterceptor as the global interceptor', () => {
    expect(providers).toContainEqual({
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    });
  });

  it('should apply HttpLoggerMiddleware to all routes', () => {
    // MiddlewareConsumer normally looks like: consumer.apply(X).forRoutes(Y)
    // We fake both methods so we can check what AppModule passes to them.
    const forRoutes = jest.fn();
    const apply = jest.fn().mockReturnValue({ forRoutes });
    const consumer = { apply };

    new AppModule().configure(consumer as any);

    expect(apply).toHaveBeenCalledWith(HttpLoggerMiddleware);
    expect(forRoutes).toHaveBeenCalledWith('*');
  });
});
