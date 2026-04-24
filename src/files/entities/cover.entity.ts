import { Exclude, Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Book } from '@/books/entities/book.entity';
import { Song } from '@/songs/entities/song.entity';
import { Movie } from '@/movies/entities/movie.entity';

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

  @UpdateDateColumn({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToOne(() => Book, (book) => book.cover)
  book: Book;

  @OneToOne(() => Song, (song) => song.cover)
  song: Song;

  @OneToOne(() => Movie, (movie) => movie.poster)
  movie: Movie;
}
