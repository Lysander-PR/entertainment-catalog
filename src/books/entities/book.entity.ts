import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { name: 'author', length: 30 })
  author: string;

  @Column('varchar', { name: 'co_writer', length: 30, nullable: true })
  coWriter?: string;

  @Column('varchar', { name: 'title', length: 50 })
  title: string;

  @Column('date', { name: 'release_date' })
  releaseDate: Date;

  @Column('varchar', { name: 'publisher', length: 50 })
  publisher: string;

  @CreateDateColumn({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
