import { Exclude, Expose } from 'class-transformer';

import { Album } from '@/songs/entities/album.entity';
import { Genre } from '@/songs/entities/genre.entity';

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
