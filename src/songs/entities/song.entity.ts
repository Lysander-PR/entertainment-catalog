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
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

@Entity('songs')
@Exclude()
export class Song {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  @ApiProperty({
    description: 'Unique identifier of the song',
    format: 'uuid',
    example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
  })
  id: string;

  @Column('varchar', { name: 'composer', length: 30, default: '' })
  @Expose()
  @ApiProperty({
    description: 'Composer name',
    example: 'Hans Zimmer',
  })
  composer: string;

  @Column('varchar', { name: 'guest_artist', length: 30, nullable: true })
  @Expose()
  @ApiPropertyOptional({
    description: 'Guest artist name',
    example: 'Billie Eilish',
  })
  guestArtist?: string;

  @Column('varchar', { name: 'title', length: 50 })
  @Expose()
  @ApiProperty({
    description: 'Song title',
    example: 'Time',
  })
  title: string;

  @Column('bool', { name: 'active', default: true })
  @ApiHideProperty()
  active: boolean;

  @Column('uuid', { name: 'album_id', nullable: false })
  @ApiHideProperty()
  albumId: string;

  @Column('uuid', { name: 'genre_id', nullable: false })
  @ApiHideProperty()
  genreId: string;

  @ManyToOne(() => Album, (album) => album.songs)
  @JoinColumn({ name: 'album_id' })
  @Expose()
  @ApiProperty({
    description: 'Album relation object',
    type: () => Album,
  })
  album: Album;

  @ManyToOne(() => Genre, (genre) => genre.songs)
  @JoinColumn({ name: 'genre_id' })
  @Expose()
  @ApiProperty({
    description: 'Genre relation object',
    type: () => Genre,
  })
  genre: Genre;

  @BeforeInsert()
  @BeforeUpdate()
  private normalize() {
    if (this.title) this.title = capitalize(this.title);
    if (this.composer) this.composer = capitalize(this.composer);
    if (this.guestArtist) this.guestArtist = capitalize(this.guestArtist);
  }
}
