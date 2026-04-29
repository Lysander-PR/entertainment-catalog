import { Repository } from 'typeorm';

import { SeedAlbum } from '@/seed/types/interfaces/seed.interface';
import { SaveSongsParams } from '@/seed/types/interfaces/save-entities.interface';
import { Genre } from '@/genres/entities/genre.entity';
import { Album } from '@/albums/entities/album.entity';
import { Song } from '@/songs/entities/song.entity';

export function saveGenres(
  seed: string[],
  genreRepository: Repository<Genre>,
): Promise<Genre[]> {
  const genres = genreRepository.create(seed.map((genre) => ({ genre })));
  return genreRepository.save(genres);
}

export function saveAlbums(
  seed: SeedAlbum[],
  albumRepository: Repository<Album>,
): Promise<Album[]> {
  const albums = albumRepository.create(
    seed.map((seedAlbum) => ({
      album: seedAlbum.album,
      releaseDate: seedAlbum.releaseDate,
      studio: seedAlbum.studio,
      artist: seedAlbum.artist,
    })),
  );

  return albumRepository.save(albums);
}

export function saveSongs({
  albums,
  albumsSeed,
  genres,
  songRepository,
}: SaveSongsParams): Promise<Song[]> {
  const songs: Song[] = [];

  albumsSeed.map((albumSeed) => {
    const albumDB = albums.find(
      (album) => album.album.toLowerCase() === albumSeed.album.toLowerCase(),
    );

    const songsWithRelations = albumSeed.songs.map((songSeed) => ({
      title: songSeed.title,
      composer: songSeed.composer,
      guestArtist: songSeed.guestArtist,
      albumId: albumDB?.id,
      genreId: genres.find(
        (genre) => genre.genre.toLowerCase() === songSeed.genre.toLowerCase(),
      )?.id,
    }));

    songs.push(...songRepository.create(songsWithRelations));
  });

  return songRepository.save(songs);
}
