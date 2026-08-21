import { Repository } from 'typeorm';

import { SyncSongByAlbumDto } from '@/albums/dto/update-album-songs.dto';
import { Song } from '@/songs/entities/song.entity';

export function buildToCreate(
  albumId: string,
  songs: SyncSongByAlbumDto[],
  songRepository: Repository<Song>,
): Song[] {
  const newSongs = songs.filter((song) => !song.id);
  return songRepository.create(newSongs.map((song) => ({ ...song, albumId })));
}

export function buildToUpdate(
  songsInAlbum: Song[],
  songs: SyncSongByAlbumDto[],
): Partial<Song>[] {
  return songs
    .filter((songDto) => songDto.id)
    .filter((songDto) => {
      const current = songsInAlbum.find((song) => song.id === songDto.id);
      if (!current) {
        return false;
      }

      return (
        !current ||
        current.composer !== songDto.composer ||
        current.genreId !== songDto.genreId ||
        current.title !== songDto.title ||
        (current.guestArtist && current.guestArtist !== songDto.guestArtist)
      );
    })
    .map((songDto) => ({ ...songDto }));
}

export function buildIdsToDeactivate(
  songsInAlbum: Song[],
  songs: SyncSongByAlbumDto[],
): string[] {
  const idsInPayload = new Set(songs.map((song) => song.id).filter(Boolean));
  return songsInAlbum
    .filter((song) => !idsInPayload.has(song.id))
    .map((song) => song.id);
}
