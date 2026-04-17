import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

@Entity('books')
@Exclude()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column('varchar', { name: 'author', length: 30 })
  @Expose()
  author: string;

  @Column('varchar', { name: 'co_writer', length: 30, nullable: true })
  @Expose()
  coWriter?: string;

  @Column('varchar', { name: 'title', length: 50 })
  @Expose()
  title: string;

  @Column('date', {
    name: 'release_date',
    transformer: {
      to: (value: Date) => value.toISOString().split('T')[0],
      from: (value: string) => new Date(value),
    },
  })
  @Expose()
  releaseDate: Date;

  @Column('bool', { name: 'active', default: true })
  active: boolean;

  @Column('varchar', { name: 'publisher', length: 50 })
  @Expose()
  publisher: string;

  @CreateDateColumn({
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Expose()
  createdAt: Date;
}
