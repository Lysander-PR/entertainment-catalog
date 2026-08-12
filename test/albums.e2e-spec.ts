/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { isUUID } from 'class-validator';

import { Song } from '@/songs/entities/song.entity';
import { Album } from '@/albums/entities/album.entity';
import { CreateAlbumDto } from '@/albums/dto/create-album.dto';
import { UpdateAlbumDto } from '@/albums/dto/update-album.dto';
import { Genre } from '@/genres/entities/genre.entity';
import { CreateGenreDto } from '@/genres/dto/create-genre.dto';
import { Cover } from '@/files/entities/cover.entity';
import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { createTestApp } from './utils/test-app.util';
import { uniqueWord } from './utils/fixtures.util';

const registerPayload: CreateUserDto = {
  email: 'albums.testing.user@google.com',
  username: 'albums-testing-user',
  password: 'Str0ng!Pass1',
};

const expectAlbumShape = (body: Record<string, unknown>) => {
  expect(body).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      album: expect.any(String),
      releaseDate: expect.any(String),
      studio: expect.any(String),
      artist: expect.any(String),
    }),
  );
  expect(isUUID(body.id as string)).toBe(true);
  expect(body).not.toHaveProperty('active');
};

describe('Albums (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let authHeader: string;
  let genreId: string;
  const albumIds: string[] = [];
  const songIds: string[] = [];
  const coverIds: string[] = [];

  beforeAll(async () => {
    ({ app, moduleFixture } = await createTestApp());
    dataSource = moduleFixture.get(DataSource);

    await dataSource
      .getRepository(User)
      .delete({ email: registerPayload.email });

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    authHeader = `Bearer ${response.body.access_token}`;

    const genrePayload: CreateGenreDto = { description: uniqueWord('Genre') };

    const genreResponse = await request(app.getHttpServer())
      .post('/api/genres')
      .set('Authorization', authHeader)
      .send(genrePayload)
      .expect(201);
    genreId = genreResponse.body.id;
  });

  afterAll(async () => {
    if (songIds.length) {
      await dataSource.getRepository(Song).delete(songIds);
    }
    if (albumIds.length) {
      await dataSource.getRepository(Album).delete(albumIds);
    }
    if (coverIds.length) {
      await dataSource.getRepository(Cover).delete(coverIds);
    }
    if (genreId) {
      await dataSource.getRepository(Genre).delete(genreId);
    }
    await dataSource
      .getRepository(User)
      .delete({ email: registerPayload.email });
    await app.close();
  });

  describe('POST /api/albums', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: CreateAlbumDto = {
        album: uniqueWord('Album'),
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('creates an album with its songs and capitalizes its text fields', async () => {
      const payload: CreateAlbumDto = {
        album: uniqueWord('Album'),
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);

      albumIds.push(response.body.id);
      songIds.push(response.body.songs[0].id);
      expectAlbumShape(response.body);
      expect(response.body.songs).toHaveLength(1);
      expect(response.body.album).toBe(capitalize(payload.album));
      expect(response.body.artist).toBe(capitalize(payload.artist));
      expect(response.body.studio).toBe(capitalize(payload.studio));
    });

    it('rejects a duplicate album title, even with a different artist', async () => {
      const albumTitle = uniqueWord('Album');
      const payload: CreateAlbumDto = {
        album: albumTitle,
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist One',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const first = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      albumIds.push(first.body.id);
      songIds.push(first.body.songs[0].id);

      const duplicate: CreateAlbumDto = {
        album: albumTitle,
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist Two',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(duplicate)
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toContain('already exists');
    });

    it('accepts a cover image and stores it through the storage service', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .field('album', uniqueWord('Album'))
        .field('studio', 'Studio')
        .field('releaseDate', '2020-01-01')
        .field('artist', 'Artist')
        .field(
          'songs',
          JSON.stringify([
            { composer: 'Composer', title: uniqueWord('Song'), genreId },
          ]),
        )
        .attach('cover', Buffer.from([0xff, 0xd8, 0xff]), {
          filename: 'cover.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      albumIds.push(response.body.id);
      songIds.push(response.body.songs[0].id);
      coverIds.push(response.body.coverId);
      expectAlbumShape(response.body);
      expect(response.body.coverId).toBeDefined();
      expect(isUUID(response.body.coverId)).toBe(true);
    });
  });

  describe('POST /api/albums (DTO validation)', () => {
    it('rejects an empty album title', async () => {
      const payload: CreateAlbumDto = {
        album: '',
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'album must be longer than or equal to 1 characters',
      );
    });

    it('rejects an album title longer than 100 characters', async () => {
      const payload: CreateAlbumDto = {
        album: 'a'.repeat(101),
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'album must be shorter than or equal to 100 characters',
      );
    });

    it('rejects a studio longer than 20 characters', async () => {
      const payload: CreateAlbumDto = {
        album: uniqueWord('Album'),
        studio: 'a'.repeat(21),
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'studio must be shorter than or equal to 20 characters',
      );
    });

    it('rejects an artist longer than 30 characters', async () => {
      const payload: CreateAlbumDto = {
        album: uniqueWord('Album'),
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'a'.repeat(31),
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'artist must be shorter than or equal to 30 characters',
      );
    });

    it('rejects an invalid release date', async () => {
      const payload = {
        album: uniqueWord('Album'),
        studio: 'Studio',
        releaseDate: 'not-a-date',
        artist: 'Artist',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      } as unknown as CreateAlbumDto;

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'releaseDate must be a Date instance',
      );
    });

    it('rejects an empty songs array', async () => {
      const payload: CreateAlbumDto = {
        album: uniqueWord('Album'),
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'songs must contain at least 1 elements',
      );
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        album: uniqueWord('Album'),
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
        extraField: 'not allowed',
      } as unknown as CreateAlbumDto;

      const response = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('GET /api/albums', () => {
    it('is public and returns a paginated list of albums', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/albums')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: expect.any(Array),
          total: expect.any(Number),
          currentPage: expect.any(Number),
          totalPages: expect.any(Number),
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: expect.any(Boolean),
        }),
      );
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.hasPreviousPage).toBe(false);
      expect(response.body.total).toBeGreaterThanOrEqual(
        response.body.data.length,
      );
      (response.body.data as Record<string, unknown>[]).forEach((album) =>
        expectAlbumShape(album),
      );
    });

    it('reports the unpaginated total and the page flags', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/albums?limit=1&page=1')
        .expect(200);

      // With limit=1 there is one page per record, so totalPages mirrors total
      expect(response.body.data).toHaveLength(1);
      expect(response.body.totalPages).toBe(response.body.total);
      expect(response.body.hasNextPage).toBe(response.body.total > 1);
      expect(response.body.hasPreviousPage).toBe(false);
    });
  });

  describe('GET /api/albums/:id', () => {
    it('returns 404 for an unknown id', async () => {
      const unknownId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/api/albums/${unknownId}`)
        .expect(404);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `Album with id ${unknownId} not found`,
      );
    });

    it('returns the created album with its songs and each song genre', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/albums/${albumIds[0]}`)
        .expect(200);

      expectAlbumShape(response.body);
      expect(response.body.id).toBe(albumIds[0]);
      expect(response.body.songs).toHaveLength(1);
      expect(response.body.songs[0]).toEqual(
        expect.objectContaining({
          id: songIds[0],
          genre: expect.objectContaining({
            id: genreId,
            genre: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('PATCH /api/albums/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: UpdateAlbumDto = { studio: 'New Studio' };

      const response = await request(app.getHttpServer())
        .patch(`/api/albums/${albumIds[0]}`)
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('updates the studio', async () => {
      const payload: UpdateAlbumDto = { studio: 'New Studio' };

      const response = await request(app.getHttpServer())
        .patch(`/api/albums/${albumIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(200);

      expectAlbumShape(response.body);
      expect(response.body.id).toBe(albumIds[0]);
      expect(response.body.studio).toBe(capitalize(payload.studio!));
    });
  });

  describe('PATCH /api/albums/:id (DTO validation)', () => {
    it('rejects a studio longer than 20 characters', async () => {
      const payload: UpdateAlbumDto = { studio: 'a'.repeat(21) };

      const response = await request(app.getHttpServer())
        .patch(`/api/albums/${albumIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'studio must be shorter than or equal to 20 characters',
      );
    });

    it('rejects an album title longer than 100 characters', async () => {
      const payload: UpdateAlbumDto = { album: 'a'.repeat(101) };

      const response = await request(app.getHttpServer())
        .patch(`/api/albums/${albumIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'album must be shorter than or equal to 100 characters',
      );
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        extraField: 'not allowed',
      } as unknown as UpdateAlbumDto;

      const response = await request(app.getHttpServer())
        .patch(`/api/albums/${albumIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('DELETE /api/albums/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/albums/${albumIds[0]}`)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('deletes, then reactivates a temporary album (also toggles its songs)', async () => {
      const payload: CreateAlbumDto = {
        album: uniqueWord('Album'),
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const created = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      albumIds.push(created.body.id);
      songIds.push(created.body.songs[0].id);

      const deleted = await request(app.getHttpServer())
        .delete(`/api/albums/${created.body.id}`)
        .set('Authorization', authHeader)
        .expect(200);

      expectAlbumShape(deleted.body);
      expect(deleted.body.id).toBe(created.body.id);

      const notFound = await request(app.getHttpServer())
        .get(`/api/albums/${created.body.id}`)
        .expect(404);

      expect(typeof notFound.body.message).toBe('string');
      expect(notFound.body.message).toBe(
        `Album with id ${created.body.id} not found`,
      );

      const inactiveSong = await dataSource
        .getRepository(Song)
        .findOneBy({ id: created.body.songs[0].id });
      expect(inactiveSong?.active).toBe(false);

      const unauthorized = await request(app.getHttpServer())
        .post('/api/albums/reactivate')
        .send({ id: created.body.id })
        .expect(401);

      expect(typeof unauthorized.body.message).toBe('string');
      expect(unauthorized.body.message).toBe('Unauthorized');

      const reactivated = await request(app.getHttpServer())
        .post('/api/albums/reactivate')
        .set('Authorization', authHeader)
        .send({ id: created.body.id })
        .expect(201);

      expectAlbumShape(reactivated.body);
      expect(reactivated.body.id).toBe(created.body.id);

      const restored = await request(app.getHttpServer())
        .get(`/api/albums/${created.body.id}`)
        .expect(200);

      expectAlbumShape(restored.body);
      expect(restored.body.id).toBe(created.body.id);
    });
  });

  describe('POST /api/albums/:id/songs/reactivate', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/albums/${albumIds[0]}/songs/reactivate`)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('returns 404 for an unknown album id', async () => {
      const unknownId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .post(`/api/albums/${unknownId}/songs/reactivate`)
        .set('Authorization', authHeader)
        .expect(404);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `Album with id ${unknownId} not found`,
      );
    });

    it('returns 409 when the album is inactive', async () => {
      const payload: CreateAlbumDto = {
        album: uniqueWord('Album'),
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
      };

      const created = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      albumIds.push(created.body.id);
      songIds.push(created.body.songs[0].id);

      await request(app.getHttpServer())
        .delete(`/api/albums/${created.body.id}`)
        .set('Authorization', authHeader)
        .expect(200);

      const response = await request(app.getHttpServer())
        .post(`/api/albums/${created.body.id}/songs/reactivate`)
        .set('Authorization', authHeader)
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `Album with id ${created.body.id} is inactive, reactivate the album first`,
      );
    });

    it('reactivates every soft-deleted song of the album', async () => {
      const payload: CreateAlbumDto = {
        album: uniqueWord('Album'),
        studio: 'Studio',
        releaseDate: new Date('2020-01-01'),
        artist: 'Artist',
        songs: [
          { composer: 'Composer', title: uniqueWord('Song'), genreId },
          { composer: 'Composer', title: uniqueWord('Song'), genreId },
        ],
      };

      const created = await request(app.getHttpServer())
        .post('/api/albums')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      albumIds.push(created.body.id);
      const [firstSong, secondSong] = created.body.songs;
      songIds.push(firstSong.id, secondSong.id);

      await request(app.getHttpServer())
        .delete(`/api/songs/${firstSong.id}`)
        .set('Authorization', authHeader)
        .expect(200);

      const inactiveSong = await dataSource
        .getRepository(Song)
        .findOneBy({ id: firstSong.id });
      expect(inactiveSong?.active).toBe(false);

      const response = await request(app.getHttpServer())
        .post(`/api/albums/${created.body.id}/songs/reactivate`)
        .set('Authorization', authHeader)
        .expect(201);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      (response.body as Record<string, unknown>[]).forEach((song) => {
        expect(song).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            composer: expect.any(String),
            title: expect.any(String),
          }),
        );
        expect(song).not.toHaveProperty('active');
        expect(song).not.toHaveProperty('albumId');
      });
      expect(
        (response.body as { id: string }[]).map((song) => song.id).sort(),
      ).toEqual([firstSong.id, secondSong.id].sort());

      const reactivatedSong = await dataSource
        .getRepository(Song)
        .findOneBy({ id: firstSong.id });
      expect(reactivatedSong?.active).toBe(true);
    });
  });
});
