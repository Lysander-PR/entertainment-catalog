import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Song } from '@/songs/entities/song.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { name: 'genre', unique: true, length: 50 })
  genre: string;

  @OneToMany(() => Song, (song) => song.genre)
  songs: Song[];

  @BeforeInsert()
  @BeforeUpdate()
  private normalize() {
    if (this.genre) this.genre = capitalize(this.genre);
  }
}
