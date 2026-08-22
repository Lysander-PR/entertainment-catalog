import { Repository } from 'typeorm';

import {
  buildIdsToDeactivate,
  buildToCreate,
  buildToUpdate,
} from './build-songs.helper';
import { Song } from '@/songs/entities/song.entity';
import { SyncSongByAlbumDto } from '@/albums/dto/update-album-songs.dto';

describe('build-songs helper', () => {
  const albumId = 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23';

  const songInAlbum: Song = {
    id: 'a1f6a9f1-4b56-4f84-89c4-8ebf9d18a744',
    composer: 'Thomas Bangalter',
    title: 'Get Lucky',
    guestArtist: 'Pharrell Williams',
    active: true,
    albumId,
    genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
  } as Song;

  describe('buildToCreate', () => {
    let songRepository: { create: jest.Mock };

    beforeEach(() => {
      songRepository = { create: jest.fn() };
    });

    it('creates only the songs without id, attaching the albumId', () => {
      const songs: SyncSongByAlbumDto[] = [
        {
          id: songInAlbum.id,
          composer: songInAlbum.composer,
          title: songInAlbum.title,
          genreId: songInAlbum.genreId,
        },
        {
          composer: 'Guy-Manuel De Homem-Christo',
          title: 'Instant Crush',
          genreId: songInAlbum.genreId,
        },
      ];
      const createdSongs = [{ ...songs[1], albumId }] as Song[];
      songRepository.create.mockReturnValue(createdSongs);

      const result = buildToCreate(
        albumId,
        songs,
        songRepository as unknown as Repository<Song>,
      );

      expect(songRepository.create).toHaveBeenCalledWith([
        { ...songs[1], albumId },
      ]);
      expect(result).toEqual(createdSongs);
    });

    it('calls create with an empty array when every song has an id', () => {
      const songs: SyncSongByAlbumDto[] = [
        {
          id: songInAlbum.id,
          composer: songInAlbum.composer,
          title: songInAlbum.title,
          genreId: songInAlbum.genreId,
        },
      ];
      songRepository.create.mockReturnValue([]);

      const result = buildToCreate(
        albumId,
        songs,
        songRepository as unknown as Repository<Song>,
      );

      expect(songRepository.create).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('buildToUpdate', () => {
    it('ignores songs without id', () => {
      const songs: SyncSongByAlbumDto[] = [
        {
          composer: 'Guy-Manuel De Homem-Christo',
          title: 'Instant Crush',
          genreId: songInAlbum.genreId,
        },
      ];

      const result = buildToUpdate([songInAlbum], songs);

      expect(result).toEqual([]);
    });

    it('ignores songs whose id is not found in the album', () => {
      const songs: SyncSongByAlbumDto[] = [
        {
          id: 'b2f6a9f1-4b56-4f84-89c4-8ebf9d18a744',
          composer: songInAlbum.composer,
          title: songInAlbum.title,
          genreId: songInAlbum.genreId,
        },
      ];

      const result = buildToUpdate([songInAlbum], songs);

      expect(result).toEqual([]);
    });

    it('ignores songs that did not change any of the compared fields', () => {
      const songs: SyncSongByAlbumDto[] = [
        {
          id: songInAlbum.id,
          composer: songInAlbum.composer,
          title: songInAlbum.title,
          genreId: songInAlbum.genreId,
          guestArtist: songInAlbum.guestArtist,
        },
      ];

      const result = buildToUpdate([songInAlbum], songs);

      expect(result).toEqual([]);
    });

    it('includes songs whose composer, genreId or title changed', () => {
      const songs: SyncSongByAlbumDto[] = [
        {
          id: songInAlbum.id,
          composer: songInAlbum.composer,
          title: 'Get Lucky (Remix)',
          genreId: songInAlbum.genreId,
        },
      ];

      const result = buildToUpdate([songInAlbum], songs);

      expect(result).toEqual([{ ...songs[0] }]);
    });

    it('includes a song when the guestArtist changes and the current one is set', () => {
      const songs: SyncSongByAlbumDto[] = [
        {
          id: songInAlbum.id,
          composer: songInAlbum.composer,
          title: songInAlbum.title,
          genreId: songInAlbum.genreId,
          guestArtist: 'Nile Rodgers',
        },
      ];

      const result = buildToUpdate([songInAlbum], songs);

      expect(result).toEqual([{ ...songs[0] }]);
    });

    it('ignores a guestArtist change when the current song has no guestArtist', () => {
      const songWithoutGuest = { ...songInAlbum, guestArtist: undefined };
      const songs: SyncSongByAlbumDto[] = [
        {
          id: songInAlbum.id,
          composer: songInAlbum.composer,
          title: songInAlbum.title,
          genreId: songInAlbum.genreId,
          guestArtist: 'Nile Rodgers',
        },
      ];

      const result = buildToUpdate([songWithoutGuest as Song], songs);

      expect(result).toEqual([]);
    });
  });

  describe('buildIdsToDeactivate', () => {
    it('returns the ids of the songs in the album missing from the payload', () => {
      const songToDeactivate = {
        ...songInAlbum,
        id: 'b2f6a9f1-4b56-4f84-89c4-8ebf9d18a744',
      } as Song;
      const songs: SyncSongByAlbumDto[] = [
        {
          id: songInAlbum.id,
          composer: songInAlbum.composer,
          title: songInAlbum.title,
          genreId: songInAlbum.genreId,
        },
      ];

      const result = buildIdsToDeactivate(
        [songInAlbum, songToDeactivate],
        songs,
      );

      expect(result).toEqual([songToDeactivate.id]);
    });

    it('returns an empty array when every song in the album is kept in the payload', () => {
      const songs: SyncSongByAlbumDto[] = [
        {
          id: songInAlbum.id,
          composer: songInAlbum.composer,
          title: songInAlbum.title,
          genreId: songInAlbum.genreId,
        },
      ];

      const result = buildIdsToDeactivate([songInAlbum], songs);

      expect(result).toEqual([]);
    });

    it('ignores newly created songs without id when comparing against the album', () => {
      const songs: SyncSongByAlbumDto[] = [
        {
          id: songInAlbum.id,
          composer: songInAlbum.composer,
          title: songInAlbum.title,
          genreId: songInAlbum.genreId,
        },
        {
          composer: 'Guy-Manuel De Homem-Christo',
          title: 'Instant Crush',
          genreId: songInAlbum.genreId,
        },
      ];

      const result = buildIdsToDeactivate([songInAlbum], songs);

      expect(result).toEqual([]);
    });
  });
});
