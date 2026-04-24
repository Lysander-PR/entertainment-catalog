import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Song } from '@/songs/entities/song.entity';

@Entity('albums')
export class Album {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { name: 'album', unique: true, length: 100 })
  album: string;

  @OneToMany(() => Song, (song) => song.album)
  songs: Song[];
}
