import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Album } from '@/albums/entities/album.entity';
import { Genre } from '@/genres/entities/genre.entity';
import { Book } from '@/books/entities/book.entity';
import { Movie } from '@/movies/entities/movie.entity';
import { Song } from '@/songs/entities/song.entity';
import { Cover } from '@/files/entities/cover.entity';

import { initialData } from './data/seed.data';
import { SaveMusicParams } from './types/interfaces/save-entities.interface';
import { saveAlbums, saveGenres, saveSongs } from './helpers/save-music.helper';
import { isProd } from '@/config/envs';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly dataService: DataSource) {}

  async populate() {
    if (isProd) {
      this.logger.warn('Seed execution blocked in production environment');
      throw new Error('Cannot execute seed in production environment');
    }

    const { albums, books, genres, movies } = initialData;

    this.logger.log('Starting database seed...');
    const result = await this.dataService.transaction(
      'SERIALIZABLE',
      async (manager) => {
        this.logger.debug('Clearing existing data...');
        await manager.getRepository(Song).deleteAll();
        await manager.getRepository(Album).deleteAll();
        await manager.getRepository(Genre).deleteAll();
        await manager.getRepository(Book).deleteAll();
        await manager.getRepository(Movie).deleteAll();
        await manager.getRepository(Cover).deleteAll();

        this.logger.debug('Inserting movies...');
        const savedMovies = await manager.save(
          manager.create(
            Movie,
            movies.map(({ coverPath, ...movie }) => ({
              ...movie,
              poster: coverPath ? { file: coverPath } : undefined,
            })),
          ),
        );

        this.logger.debug('Inserting books...');
        const savedBooks = await manager.save(
          manager.create(
            Book,
            books.map(({ coverPath, ...book }) => ({
              ...book,
              cover: coverPath ? { file: coverPath } : undefined,
            })),
          ),
        );

        this.logger.debug('Inserting music data...');
        const musicResult = await this.saveMusic({
          manager,
          albumsSeed: albums,
          genresSeed: genres,
        });

        return {
          movies: savedMovies.length,
          books: savedBooks.length,
          genres: musicResult.genres.length,
          albums: musicResult.albums.length,
          songs: musicResult.songs.length,
          covers: [...movies, ...books, ...albums].filter(({ coverPath }) =>
            Boolean(coverPath),
          ).length,
        };
      },
    );
    this.logger.log('Seed completed successfully');

    return {
      message: 'Database seeded successfully',
      inserted: result,
    };
  }

  private async saveMusic({
    manager,
    genresSeed,
    albumsSeed,
  }: SaveMusicParams): Promise<{
    genres: Genre[];
    albums: Album[];
    songs: Song[];
  }> {
    const genresDB = await saveGenres(genresSeed, manager.getRepository(Genre));
    const albumsDB = await saveAlbums(albumsSeed, manager.getRepository(Album));
    const songsDB = await saveSongs({
      albumsSeed,
      albums: albumsDB,
      genres: genresDB,
      songRepository: manager.getRepository(Song),
    });

    return {
      genres: genresDB,
      albums: albumsDB,
      songs: songsDB,
    };
  }
}
