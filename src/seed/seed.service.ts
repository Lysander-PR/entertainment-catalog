import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Album } from '@/albums/entities/album.entity';
import { Genre } from '@/genres/entities/genre.entity';
import { Book } from '@/books/entities/book.entity';
import { Movie } from '@/movies/entities/movie.entity';

@Injectable()
export class SeedService {
  constructor(private readonly dataService: DataSource) {}

  populate() {}
}
