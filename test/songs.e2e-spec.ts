/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { isUUID } from 'class-validator';

import { Song } from '@/songs/entities/song.entity';
import { CreateSongDto } from '@/songs/dto/create-song.dto';
import { UpdateSongDto } from '@/songs/dto/update-song.dto';
import { Album } from '@/albums/entities/album.entity';
import { CreateAlbumDto } from '@/albums/dto/create-album.dto';
import { Genre } from '@/genres/entities/genre.entity';
import { CreateGenreDto } from '@/genres/dto/create-genre.dto';
import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { createTestApp } from './utils/test-app.util';
import { uniqueWord } from './utils/fixtures.util';

const testingEmail = 'songs.testing.user@google.com';

const expectSongShape = (body: Record<string, unknown>) => {
  expect(body).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      composer: expect.any(String),
      title: expect.any(String),
    }),
  );
  expect(isUUID(body.id as string)).toBe(true);
  expect(body).not.toHaveProperty('active');
  expect(body).not.toHaveProperty('albumId');
  expect(body).not.toHaveProperty('genreId');
};

describe('Songs (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let authHeader: string;
  let genreId: string;
  let albumId: string;
  const songIds: string[] = [];

  beforeAll(async () => {
    ({ app, moduleFixture } = await createTestApp());
    dataSource = moduleFixture.get(DataSource);

    await dataSource.getRepository(User).delete({ email: testingEmail });

    const registerPayload: CreateUserDto = {
      email: testingEmail,
      username: 'songs-testing-user',
      password: 'Str0ng!Pass1',
    };

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

    const albumPayload: CreateAlbumDto = {
      album: uniqueWord('Album'),
      studio: 'Studio',
      releaseDate: new Date('2020-01-01'),
      artist: 'Artist',
      songs: [{ composer: 'Composer', title: uniqueWord('Song'), genreId }],
    };

    const albumResponse = await request(app.getHttpServer())
      .post('/api/albums')
      .set('Authorization', authHeader)
      .send(albumPayload)
      .expect(201);
    albumId = albumResponse.body.id;
    songIds.push(albumResponse.body.songs[0].id);
  });

  afterAll(async () => {
    if (songIds.length) {
      await dataSource.getRepository(Song).delete(songIds);
    }
    if (genreId) {
      await dataSource.getRepository(Genre).delete(genreId);
    }
    if (albumId) {
      await dataSource.getRepository(Album).delete(albumId);
    }
    await dataSource.getRepository(User).delete({ email: testingEmail });
    await app.close();
  });

  describe('GET /api/songs', () => {
    it('is public and returns a paginated list of songs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/songs')
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
      (response.body.data as Record<string, unknown>[]).forEach((song) =>
        expectSongShape(song),
      );
    });

    it('reports the unpaginated total and the page flags', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/songs?limit=1&page=1')
        .expect(200);

      // With limit=1 there is one page per record, so totalPages mirrors total
      expect(response.body.data).toHaveLength(1);
      expect(response.body.totalPages).toBe(response.body.total);
      expect(response.body.hasNextPage).toBe(response.body.total > 1);
      expect(response.body.hasPreviousPage).toBe(false);
    });
  });

  describe('POST /api/songs', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: CreateSongDto = {
        composer: 'Composer',
        title: uniqueWord('Song'),
        albumId,
        genreId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('rejects an album that does not exist', async () => {
      const payload: CreateSongDto = {
        composer: 'Composer',
        title: uniqueWord('Song'),
        albumId: '00000000-0000-0000-0000-000000000000',
        genreId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toContain('is not present');
    });

    it('creates a song and capitalizes its title', async () => {
      const payload: CreateSongDto = {
        composer: 'Composer',
        title: uniqueWord('Song'),
        albumId,
        genreId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);

      songIds.push(response.body.id);
      expectSongShape(response.body);
      expect(response.body.title).toBe(capitalize(payload.title));
      expect(response.body.composer).toBe(capitalize(payload.composer));
    });

    it('rejects a duplicate title within the same album', async () => {
      const payload: CreateSongDto = {
        composer: 'Composer',
        title: uniqueWord('Song'),
        albumId,
        genreId,
      };

      const first = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      songIds.push(first.body.id);

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `Song with title ${payload.title} already exists in the album with id ${albumId}`,
      );
    });
  });

  describe('POST /api/songs (DTO validation)', () => {
    it('rejects an empty composer', async () => {
      const payload: CreateSongDto = {
        composer: '',
        title: uniqueWord('Song'),
        albumId,
        genreId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'composer must be longer than or equal to 1 characters',
      );
    });

    it('rejects a composer longer than 30 characters', async () => {
      const payload: CreateSongDto = {
        composer: 'a'.repeat(31),
        title: uniqueWord('Song'),
        albumId,
        genreId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'composer must be shorter than or equal to 30 characters',
      );
    });

    it('rejects a title longer than 50 characters', async () => {
      const payload: CreateSongDto = {
        composer: 'Composer',
        title: 'a'.repeat(51),
        albumId,
        genreId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'title must be shorter than or equal to 50 characters',
      );
    });

    it('rejects a guest artist longer than 30 characters', async () => {
      const payload: CreateSongDto = {
        composer: 'Composer',
        guestArtist: 'a'.repeat(31),
        title: uniqueWord('Song'),
        albumId,
        genreId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'guestArtist must be shorter than or equal to 30 characters',
      );
    });

    it('rejects an albumId that is not a uuid', async () => {
      const payload: CreateSongDto = {
        composer: 'Composer',
        title: uniqueWord('Song'),
        albumId: 'not-a-uuid',
        genreId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('albumId must be a UUID');
    });

    it('rejects a genreId that is not a uuid', async () => {
      const payload: CreateSongDto = {
        composer: 'Composer',
        title: uniqueWord('Song'),
        albumId,
        genreId: 'not-a-uuid',
      };

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('genreId must be a UUID');
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        composer: 'Composer',
        title: uniqueWord('Song'),
        albumId,
        genreId,
        extraField: 'not allowed',
      } as unknown as CreateSongDto;

      const response = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('GET /api/songs/:id', () => {
    it('returns 404 for an unknown id', async () => {
      const unknownId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/api/songs/${unknownId}`)
        .expect(404);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(`Song with id ${unknownId} not found`);
    });

    it('returns the song with its relations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/songs/${songIds[0]}`)
        .expect(200);

      expectSongShape(response.body);
      expect(response.body.id).toBe(songIds[0]);
      expect(response.body.album.id).toBe(albumId);
      expect(response.body.genre.id).toBe(genreId);
    });
  });

  describe('PATCH /api/songs/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: UpdateSongDto = { title: uniqueWord('Song') };

      const response = await request(app.getHttpServer())
        .patch(`/api/songs/${songIds[0]}`)
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('returns the song unchanged when the body is empty', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/songs/${songIds[0]}`)
        .set('Authorization', authHeader)
        .send({})
        .expect(200);

      expectSongShape(response.body);
      expect(response.body.id).toBe(songIds[0]);
    });

    it('updates the title', async () => {
      const payload: UpdateSongDto = { title: uniqueWord('Song') };

      const response = await request(app.getHttpServer())
        .patch(`/api/songs/${songIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(200);

      expectSongShape(response.body);
      expect(response.body.id).toBe(songIds[0]);
      expect(response.body.title).toBe(capitalize(payload.title!));
    });
  });

  describe('PATCH /api/songs/:id (DTO validation)', () => {
    it('rejects a title longer than 50 characters', async () => {
      const payload: UpdateSongDto = { title: 'a'.repeat(51) };

      const response = await request(app.getHttpServer())
        .patch(`/api/songs/${songIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'title must be shorter than or equal to 50 characters',
      );
    });

    it('rejects an albumId that is not a uuid', async () => {
      const payload: UpdateSongDto = { albumId: 'not-a-uuid' };

      const response = await request(app.getHttpServer())
        .patch(`/api/songs/${songIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('albumId must be a UUID');
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        extraField: 'not allowed',
      } as unknown as UpdateSongDto;

      const response = await request(app.getHttpServer())
        .patch(`/api/songs/${songIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('DELETE /api/songs/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/songs/${songIds[0]}`)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('deletes, then reactivates a temporary song', async () => {
      const payload: CreateSongDto = {
        composer: 'Composer',
        title: uniqueWord('Song'),
        albumId,
        genreId,
      };

      const created = await request(app.getHttpServer())
        .post('/api/songs')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      songIds.push(created.body.id);

      const deleted = await request(app.getHttpServer())
        .delete(`/api/songs/${created.body.id}`)
        .set('Authorization', authHeader)
        .expect(200);

      expectSongShape(deleted.body);
      expect(deleted.body.id).toBe(created.body.id);

      const notFound = await request(app.getHttpServer())
        .get(`/api/songs/${created.body.id}`)
        .expect(404);

      expect(typeof notFound.body.message).toBe('string');
      expect(notFound.body.message).toBe(
        `Song with id ${created.body.id} not found`,
      );

      const unauthorized = await request(app.getHttpServer())
        .post('/api/songs/reactivate')
        .send({ id: created.body.id })
        .expect(401);

      expect(typeof unauthorized.body.message).toBe('string');
      expect(unauthorized.body.message).toBe('Unauthorized');

      const reactivated = await request(app.getHttpServer())
        .post('/api/songs/reactivate')
        .set('Authorization', authHeader)
        .send({ id: created.body.id })
        .expect(201);

      expectSongShape(reactivated.body);
      expect(reactivated.body.id).toBe(created.body.id);

      const restored = await request(app.getHttpServer())
        .get(`/api/songs/${created.body.id}`)
        .expect(200);

      expectSongShape(restored.body);
      expect(restored.body.id).toBe(created.body.id);
    });
  });
});
