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
import { ApiProperty } from '@nestjs/swagger';

@Entity('covers')
@Exclude()
export class Cover {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  @ApiProperty({
    description: 'Unique identifier of the stored file',
    format: 'uuid',
    example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
  })
  id!: string;

  @Column('text', { name: 'file' })
  @Expose()
  @ApiProperty({
    description: 'Public URL of the stored file',
    example: 'entertainment_folder/abc123-cover.jpg',
  })
  file!: string;

  @CreateDateColumn({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  @Expose()
  @ApiProperty({
    description: 'Date when the file metadata was created',
    example: '2026-05-18T20:25:30.000Z',
  })
  createdAt!: Date;

  @OneToOne(() => Book, (book) => book.cover)
  book!: Book;

  @OneToOne(() => Album, (album) => album.cover)
  album!: Album;

  @OneToOne(() => Movie, (movie) => movie.poster)
  movie!: Movie;
}
