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
import { ApiProperty } from '@nestjs/swagger';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Unique identifier of the genre',
    format: 'uuid',
    example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
  })
  id!: string;

  @Column('varchar', { name: 'genre', unique: true, length: 50 })
  @ApiProperty({
    description: 'Genre name',
    example: 'Rock',
  })
  genre!: string;

  @OneToMany(() => Song, (song) => song.genre)
  songs!: Song[];

  @BeforeInsert()
  @BeforeUpdate()
  private normalize() {
    if (this.genre) this.genre = capitalize(this.genre);
  }
}
