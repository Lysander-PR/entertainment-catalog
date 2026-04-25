import { Cover } from '@/files/entities/cover.entity';
import { Exclude, Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('movies')
@Exclude()
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column('varchar', { name: 'director', length: 30 })
  @Expose()
  director: string;

  @Column('varchar', { name: 'title', length: 30 })
  @Expose()
  title: string;

  @Column('varchar', { name: 'writer', length: 30 })
  @Expose()
  writer: string;

  @Column('varchar', { name: 'studio', length: 20 })
  @Expose()
  studio: string;

  @Column('varchar', { name: 'protagonist', length: 30 })
  @Expose()
  protagonist: string;

  @Column('date', {
    name: 'release_date',
    transformer: {
      to: (value: Date) => value.toISOString().split('T')[0],
      from: (value: string) => new Date(value),
    },
  })
  @Expose()
  releaseDate: Date;

  @Column('text', { name: 'soundtrack', nullable: true })
  @Expose()
  soundtrack?: string;

  @Column('bool', { name: 'active', default: true })
  active: boolean;

  @CreateDateColumn({
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Expose()
  createdAt: Date;

  @Column('uuid', { name: 'poster_id', nullable: true })
  @Expose()
  posterId?: string;

  @OneToOne(() => Cover, (cover) => cover.movie, { cascade: true, eager: true })
  @JoinColumn({ name: 'poster_id' })
  @Expose()
  poster?: Cover;
}
