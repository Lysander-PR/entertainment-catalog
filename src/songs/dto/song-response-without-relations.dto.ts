import { Exclude, Expose } from 'class-transformer';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import { Album } from '@/albums/entities/album.entity';
import { Genre } from '@/genres/entities/genre.entity';

@Exclude()
export class SongResponseWithoutRelationsDto {
  @Expose()
  @ApiProperty({
    description: 'Unique identifier of the song',
    format: 'uuid',
    example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
  })
  id: string;

  @Expose()
  @ApiHideProperty()
  artist: string;

  @Expose()
  @ApiProperty({
    description: 'Composer name',
    example: 'Hans Zimmer',
  })
  composer: string;

  @Expose()
  @ApiHideProperty()
  studio: string;

  @Expose()
  @ApiHideProperty()
  releaseDate: Date;

  @Expose()
  @ApiPropertyOptional({
    description: 'Guest artist',
    example: 'Billie Eilish',
  })
  guestArtist: string;

  @Expose()
  @ApiProperty({
    description: 'Song title',
    example: 'Time',
  })
  title: string;

  @ApiHideProperty()
  active: boolean;

  @ApiHideProperty()
  album: Album;

  @ApiHideProperty()
  genre: Genre;
}
