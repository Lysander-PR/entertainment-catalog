import { Exclude, Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Book } from '@/books/entities/book.entity';
import { Movie } from '@/movies/entities/movie.entity';
import { Album } from '@/albums/entities/album.entity';

@Entity('covers')
@Exclude()
export class Cover {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column('text', { name: 'file' })
  @Expose()
  file: string;

  @CreateDateColumn({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  @Expose()
  createdAt: Date;

  @OneToOne(() => Book, (book) => book.cover)
  book: Book;

  @OneToOne(() => Album, (album) => album.cover)
  album: Album;

  @OneToOne(() => Movie, (movie) => movie.poster)
  movie: Movie;
}
