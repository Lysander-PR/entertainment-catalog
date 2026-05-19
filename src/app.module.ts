import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from './books/books.module';
import { envs } from './config/envs';
import { MoviesModule } from './movies/movies.module';
import { SongsModule } from './songs/songs.module';
import { FilesModule } from './files/files.module';
import { AlbumsModule } from './albums/albums.module';
import { GenresModule } from './genres/genres.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.DB_HOST,
      port: envs.DB_PORT,
      username: envs.DB_USER,
      password: envs.DB_PASSWORD,
      database: envs.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    CacheModule.registerAsync({
      useFactory: () => ({
        ttl: 3 * 60 * 1000,
        stores: [createKeyv(envs.REDIS_URL)],
      }),
      isGlobal: true,
    }),
    BooksModule,
    MoviesModule,
    SongsModule,
    FilesModule,
    AlbumsModule,
    GenresModule,
    CommonModule,
    SeedModule,
  ],
  providers: [],
})
export class AppModule {}
