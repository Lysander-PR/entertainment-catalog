import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Song } from './song.entity';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { name: 'genre', unique: true, length: 50 })
  genre: string;

  @OneToMany(() => Song, (song) => song.genre)
  songs: Song[];
}
