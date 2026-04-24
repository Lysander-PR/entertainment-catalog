import { Exclude, Expose } from 'class-transformer';

import { Album } from '@/albums/entities/album.entity';
import { Genre } from '@/genres/entities/genre.entity';

@Exclude()
export class SongResponseWithoutRelationsDto {
  @Expose()
  id: string;

  @Expose()
  artist: string;

  @Expose()
  composer: string;

  @Expose()
  studio: string;

  @Expose()
  releaseDate: Date;

  @Expose()
  guestArtist: string;

  @Expose()
  title: string;

  active: boolean;

  album: Album;

  genre: Genre;
}
