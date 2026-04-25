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
    BooksModule,
    MoviesModule,
    SongsModule,
    FilesModule,
    AlbumsModule,
    GenresModule,
    CommonModule,
  ],
  providers: [],
})
export class AppModule {}
