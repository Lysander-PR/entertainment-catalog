import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Song } from '@/songs/entities/song.entity';
import { Exclude, Expose } from 'class-transformer';
import { Cover } from '@/files/entities/cover.entity';

@Entity('albums')
@Exclude()
export class Album {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column('varchar', { name: 'album', unique: true, length: 100 })
  @Expose()
  album: string;

  @Column('date', {
    name: 'release_date',
    transformer: {
      to: (value: Date) => value.toISOString().split('T')[0],
      from: (value: string) => new Date(value),
    },
  })
  @Expose()
  releaseDate: Date;

  @Column('varchar', { name: 'studio', length: 20 })
  @Expose()
  studio: string;

  @Column('varchar', { name: 'artist', length: 30 })
  @Expose()
  artist: string;

  @Column('bool', { name: 'active', default: true })
  active: boolean;

  @OneToMany(() => Song, (song) => song.album)
  @Expose()
  songs: Song[];

  @Column('uuid', { name: 'cover_id', nullable: true })
  @Expose()
  coverId?: string;

  @OneToOne(() => Cover, (cover) => cover.album, { cascade: true, eager: true })
  @JoinColumn({ name: 'cover_id' })
  @Expose()
  cover?: Cover;
}
