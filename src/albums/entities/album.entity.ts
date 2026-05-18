import {
  BeforeInsert,
  BeforeUpdate,
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
import { capitalize } from '@/common/helpers/capitalize.helper';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

@Entity('albums')
@Exclude()
export class Album {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  @ApiProperty({
    description: 'Unique identifier of the album',
    format: 'uuid',
    example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
  })
  id!: string;

  @Column('varchar', { name: 'album', unique: true, length: 100 })
  @Expose()
  @ApiProperty({
    description: 'Album title',
    example: 'Random Access Memories',
  })
  album!: string;

  @Column('date', {
    name: 'release_date',
    transformer: {
      to: (value: Date) => value.toISOString().split('T')[0],
      from: (value: string) => new Date(value),
    },
  })
  @Expose()
  @ApiProperty({
    description: 'Album release date',
    type: String,
    format: 'date',
    example: '2013-05-17',
  })
  releaseDate!: Date;

  @Column('varchar', { name: 'studio', length: 50 })
  @Expose()
  @ApiProperty({
    description: 'Production studio',
    example: 'Columbia',
  })
  studio!: string;

  @Column('varchar', { name: 'artist', length: 50 })
  @Expose()
  @ApiProperty({
    description: 'Main artist',
    example: 'Daft Punk',
  })
  artist!: string;

  @Column('bool', { name: 'active', default: true })
  @ApiHideProperty()
  active: boolean;

  @OneToMany(() => Song, (song) => song.album)
  @Expose()
  @ApiProperty({
    description: 'Songs belonging to this album',
    type: () => Song,
    isArray: true,
  })
  songs!: Song[];

  @Column('uuid', { name: 'cover_id', nullable: true })
  @Expose()
  @ApiPropertyOptional({
    description: 'Associated cover id',
    format: 'uuid',
    example: '5d89a0fa-fb6d-4e65-ae09-111c6b334b7f',
  })
  coverId?: string;

  @OneToOne(() => Cover, (cover) => cover.album, { cascade: true, eager: true })
  @JoinColumn({ name: 'cover_id' })
  @Expose()
  @ApiPropertyOptional({
    description: 'Cover metadata object',
    type: () => Cover,
  })
  cover?: Cover;

  @BeforeInsert()
  @BeforeUpdate()
  private normalize() {
    if (this.album) this.album = capitalize(this.album);
    if (this.artist) this.artist = capitalize(this.artist);
    if (this.studio) this.studio = capitalize(this.studio);
  }
}
