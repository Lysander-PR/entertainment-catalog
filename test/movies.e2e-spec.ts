/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { isUUID } from 'class-validator';

import { Movie } from '@/movies/entities/movie.entity';
import { CreateMovieDto } from '@/movies/dto/create-movie.dto';
import { UpdateMovieDto } from '@/movies/dto/update-movie.dto';
import { Cover } from '@/files/entities/cover.entity';
import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { createTestApp } from './utils/test-app.util';
import { uniqueWord } from './utils/fixtures.util';
import { capitalize } from '@/common/helpers/capitalize.helper';

const testingUser: CreateUserDto = {
  email: 'movies.testing.user@google.com',
  username: 'movies-testing-user',
  password: 'Str0ng!Pass1',
};

const expectMovieShape = (body: Record<string, unknown>) => {
  expect(body).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      director: expect.any(String),
      title: expect.any(String),
      writer: expect.any(String),
      studio: expect.any(String),
      protagonist: expect.any(String),
      releaseDate: expect.any(String),
      createdAt: expect.any(String),
    }),
  );
  expect(isUUID(body.id as string)).toBe(true);
  expect(body).not.toHaveProperty('active');
};

describe('Movies (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let authHeader: string;
  const movieIds: string[] = [];
  const coverIds: string[] = [];

  beforeAll(async () => {
    ({ app, moduleFixture } = await createTestApp());
    dataSource = moduleFixture.get(DataSource);

    await dataSource.getRepository(User).delete({ email: testingUser.email });

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testingUser)
      .expect(201);

    authHeader = `Bearer ${response.body.access_token}`;
  });

  afterAll(async () => {
    if (movieIds.length) {
      await dataSource.getRepository(Movie).delete(movieIds);
    }
    if (coverIds.length) {
      await dataSource.getRepository(Cover).delete(coverIds);
    }
    await dataSource.getRepository(User).delete({ email: testingUser.email });
    await app.close();
  });

  describe('POST /api/movies', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('rejects a director with digits', async () => {
      const payload: CreateMovieDto = {
        director: 'Director123',
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        `director must contain only letters and spaces: ${payload.director}`,
      );
    });

    it('creates a movie with a soundtrack and capitalizes its text fields', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
        soundtrack: 'https://open.spotify.com/track/example',
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);

      movieIds.push(response.body.id);
      expectMovieShape(response.body);
      expect(response.body.soundtrack).toBe(payload.soundtrack);
      expect(response.body).toEqual(
        expect.objectContaining({
          director: capitalize(payload.director),
          title: capitalize(payload.title),
          writer: capitalize(payload.writer),
          studio: capitalize(payload.studio),
          protagonist: capitalize(payload.protagonist),
        }),
      );
    });

    it('rejects a duplicate title/director/studio combination', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const first = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      movieIds.push(first.body.id);

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send({
          ...payload,
          writer: uniqueWord('Wri'),
          protagonist: uniqueWord('Pro'),
        })
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `Movie with title "${payload.title}", director "${payload.director}" and studio ${payload.studio} already exists`,
      );
    });

    it('accepts a cover image through the storage service', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .field('director', payload.director)
        .field('title', payload.title)
        .field('writer', payload.writer)
        .field('studio', payload.studio)
        .field('protagonist', payload.protagonist)
        .field('releaseDate', payload.releaseDate.toISOString())
        .attach('cover', Buffer.from([0xff, 0xd8, 0xff]), {
          filename: 'poster.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      movieIds.push(response.body.id);
      coverIds.push(response.body.posterId);
      expectMovieShape(response.body);
      expect(response.body.posterId).toBeDefined();
      expect(isUUID(response.body.posterId)).toBe(true);
    });
  });

  describe('POST /api/movies (DTO validation)', () => {
    it('rejects a director longer than 30 characters', async () => {
      const payload: CreateMovieDto = {
        director: 'a'.repeat(31),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'director must be shorter than or equal to 30 characters',
      );
    });

    it('rejects an empty director', async () => {
      const payload: CreateMovieDto = {
        director: '',
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'director must be longer than or equal to 1 characters',
      );
    });

    it('rejects a director that is not a string', async () => {
      const payload = {
        director: 123,
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      } as unknown as CreateMovieDto;

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('director must be a string');
    });

    it('rejects a title longer than 30 characters', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: 'a'.repeat(31),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'title must be shorter than or equal to 30 characters',
      );
    });

    it('rejects a title that is not a string', async () => {
      const payload = {
        director: uniqueWord('Dir'),
        title: 123,
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      } as unknown as CreateMovieDto;

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('title must be a string');
    });

    it('rejects a writer with digits', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: 'Writer123',
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        `writer must contain only letters and spaces: ${payload.writer}`,
      );
    });

    it('rejects a studio longer than 20 characters', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'a'.repeat(21),
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'studio must be shorter than or equal to 20 characters',
      );
    });

    it('rejects a protagonist with digits', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: 'Protagonist123',
        releaseDate: new Date('2021-10-22'),
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        `protagonist must contain only letters and spaces: ${payload.protagonist}`,
      );
    });

    it('rejects an invalid release date', async () => {
      const payload = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: 'not-a-date',
      } as unknown as CreateMovieDto;

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'releaseDate must be a Date instance',
      );
    });

    it('rejects a missing release date', async () => {
      const payload = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
      } as unknown as CreateMovieDto;

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'releaseDate must be a Date instance',
      );
    });

    it('rejects an invalid soundtrack URL', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
        soundtrack: 'not-a-url',
      };

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'soundtrack must be a URL address',
      );
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
        extraField: 'not allowed',
      } as unknown as CreateMovieDto;

      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('GET /api/movies', () => {
    it('is public and returns a list of movies', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      (response.body as Record<string, unknown>[]).forEach((movie) =>
        expectMovieShape(movie),
      );
    });
  });

  describe('GET /api/movies/:id', () => {
    it('returns 404 for an unknown id', async () => {
      const unknownId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/api/movies/${unknownId}`)
        .expect(404);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `Movie with id ${unknownId} not found`,
      );
    });

    it('returns the created movie', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/movies/${movieIds[0]}`)
        .expect(200);

      expectMovieShape(response.body);
      expect(response.body.id).toBe(movieIds[0]);
    });
  });

  describe('PATCH /api/movies/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: UpdateMovieDto = { studio: 'New Studio' };

      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieIds[0]}`)
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('updates the studio', async () => {
      const payload: UpdateMovieDto = { studio: 'New Studio' };

      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(200);

      expectMovieShape(response.body);
      expect(response.body.id).toBe(movieIds[0]);
      expect(response.body.studio).toBe(capitalize(payload.studio!));
    });
  });

  describe('PATCH /api/movies/:id (DTO validation)', () => {
    it('rejects a director with digits', async () => {
      const payload: UpdateMovieDto = { director: 'Director123' };

      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        `director must contain only letters and spaces: ${payload.director}`,
      );
    });

    it('rejects a studio longer than 20 characters', async () => {
      const payload: UpdateMovieDto = { studio: 'a'.repeat(21) };

      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'studio must be shorter than or equal to 20 characters',
      );
    });

    it('rejects an invalid soundtrack URL', async () => {
      const payload: UpdateMovieDto = { soundtrack: 'not-a-url' };

      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'soundtrack must be a URL address',
      );
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        extraField: 'not allowed',
      } as unknown as UpdateMovieDto;

      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/movies/${movieIds[0]}`)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('deletes, then reactivates a temporary movie', async () => {
      const payload: CreateMovieDto = {
        director: uniqueWord('Dir'),
        title: uniqueWord('Title'),
        writer: uniqueWord('Wri'),
        studio: 'Studio',
        protagonist: uniqueWord('Pro'),
        releaseDate: new Date('2021-10-22'),
      };

      const created = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      movieIds.push(created.body.id);
      expectMovieShape(created.body);

      const deleted = await request(app.getHttpServer())
        .delete(`/api/movies/${created.body.id}`)
        .set('Authorization', authHeader)
        .expect(200);

      expectMovieShape(deleted.body);
      expect(deleted.body.id).toBe(created.body.id);

      const notFound = await request(app.getHttpServer())
        .get(`/api/movies/${created.body.id}`)
        .expect(404);

      expect(typeof notFound.body.message).toBe('string');
      expect(notFound.body.message).toBe(
        `Movie with id ${created.body.id} not found`,
      );

      const reactivated = await request(app.getHttpServer())
        .post('/api/movies/reactivate')
        .set('Authorization', authHeader)
        .send({ id: created.body.id })
        .expect(201);

      expectMovieShape(reactivated.body);
      expect(reactivated.body.id).toBe(created.body.id);

      const restored = await request(app.getHttpServer())
        .get(`/api/movies/${created.body.id}`)
        .expect(200);

      expectMovieShape(restored.body);
      expect(restored.body.id).toBe(created.body.id);
    });
  });
});
