import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Album } from './album.entity';
import { Genre } from './genre.entity';
import { Exclude, Expose } from 'class-transformer';

@Entity('songs')
@Exclude()
export class Song {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column('varchar', { name: 'artist', length: 30 })
  @Expose()
  artist: string;

  @Column('varchar', { name: 'composer', length: 30 })
  @Expose()
  composer: string;

  @Column('varchar', { name: 'studio', length: 20 })
  @Expose()
  studio: string;

  @Column('date', {
    name: 'release_date',
    transformer: {
      to: (value: Date) => value.toISOString().split('T')[0],
      from: (value: string) => new Date(value),
    },
  })
  @Expose()
  releaseDate: Date;

  @Column('varchar', { name: 'guest_artist', length: 30 })
  @Expose()
  guestArtist: string;

  @Column('varchar', { name: 'title', length: 50 })
  @Expose()
  title: string;

  @Column('bool', { name: 'active', default: false })
  active: boolean;

  @Column('uuid', { name: 'album_id', nullable: false })
  albumId: string;

  @Column('uuid', { name: 'genre_id', nullable: false })
  genreId: string;

  @ManyToOne(() => Album, (album) => album.songs)
  @JoinColumn({ name: 'album_id' })
  @Expose()
  album: Album;

  @ManyToOne(() => Genre, (genre) => genre.songs)
  @JoinColumn({ name: 'genre_id' })
  @Expose()
  genre: Genre;
}
