import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Album } from '@/albums/entities/album.entity';
import { Genre } from '@/genres/entities/genre.entity';
import { Exclude, Expose } from 'class-transformer';
import { capitalize } from '@/common/helpers/capitalize.helper';

@Entity('songs')
@Exclude()
export class Song {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column('varchar', { name: 'composer', length: 30, default: '' })
  @Expose()
  composer: string;

  @Column('varchar', { name: 'guest_artist', length: 30, nullable: true })
  @Expose()
  guestArtist?: string;

  @Column('varchar', { name: 'title', length: 50 })
  @Expose()
  title: string;

  @Column('bool', { name: 'active', default: true })
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

  @BeforeInsert()
  @BeforeUpdate()
  private normalize() {
    if (this.title) this.title = capitalize(this.title);
    if (this.composer) this.composer = capitalize(this.composer);
    if (this.guestArtist) this.guestArtist = capitalize(this.guestArtist);
  }
}
