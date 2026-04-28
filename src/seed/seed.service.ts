import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Album } from '@/albums/entities/album.entity';
import { Genre } from '@/genres/entities/genre.entity';
import { Book } from '@/books/entities/book.entity';
import { Movie } from '@/movies/entities/movie.entity';

import { initialData } from './data/seed.data';

@Injectable()
export class SeedService {
  constructor(private readonly dataService: DataSource) {}

  async populate() {
    await this.dataService.getRepository(Movie).deleteAll();
    await this.dataService.getRepository(Book).deleteAll();
    await this.dataService.getRepository(Genre).deleteAll();

    const { albums, books, genres, movies } = initialData;

    await this.dataService.transaction('SERIALIZABLE', async (manager) => {
      const moviesEntity = manager.create(Movie, movies);
      const booksEntity = manager.create(Book, books);
      const genresEntity = manager.create(
        Genre,
        genres.map((genre) => ({ genre })),
      );

      await manager.save(moviesEntity);
      await manager.save(booksEntity);
      const genresDB = await manager.save(genresEntity);
    });

    return 'SEED EXECUTED';
  }
}
