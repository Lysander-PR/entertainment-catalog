import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from './books/books.module';
import { MoviesModule } from './movies/movies.module';
import { SongsModule } from './songs/songs.module';
import { FilesModule } from './files/files.module';
import { AlbumsModule } from './albums/albums.module';
import { GenresModule } from './genres/genres.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { databaseConfig } from './config/database.config';
import { cacheConfig } from './config/cache.config';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    CacheModule.register({ ...cacheConfig, isGlobal: true }),
    BooksModule,
    MoviesModule,
    SongsModule,
    FilesModule,
    AlbumsModule,
    GenresModule,
    CommonModule,
    SeedModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
