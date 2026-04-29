import { EntityManager, Repository } from 'typeorm';

import { SeedAlbum } from './seed.interface';
import { Album } from '@/albums/entities/album.entity';
import { Genre } from '@/genres/entities/genre.entity';
import { Song } from '@/songs/entities/song.entity';

export interface SaveMusicParams {
  manager: EntityManager;
  genresSeed: string[];
  albumsSeed: SeedAlbum[];
}

export interface SaveSongsParams {
  albumsSeed: SeedAlbum[];
  albums: Album[];
  genres: Genre[];
  songRepository: Repository<Song>;
}
