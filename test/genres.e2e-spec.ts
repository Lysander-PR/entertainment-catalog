/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { isUUID } from 'class-validator';

import { Genre } from '@/genres/entities/genre.entity';
import { CreateGenreDto } from '@/genres/dto/create-genre.dto';
import { UpdateGenreDto } from '@/genres/dto/update-genre.dto';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { createTestApp } from './utils/test-app.util';
import { uniqueWord } from './utils/fixtures.util';

const testingEmail = 'genres.testing.user@google.com';

const expectGenreShape = (body: Record<string, unknown>) => {
  expect(body).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      genre: expect.any(String),
    }),
  );
  expect(isUUID(body.id as string)).toBe(true);
};

describe('Genres (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let authHeader: string;
  const genreIds: string[] = [];

  beforeAll(async () => {
    ({ app, moduleFixture } = await createTestApp());
    dataSource = moduleFixture.get(DataSource);

    await dataSource.getRepository(User).delete({ email: testingEmail });

    const registerPayload: CreateUserDto = {
      email: testingEmail,
      username: 'genres-testing-user',
      password: 'Str0ng!Pass1',
    };

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    authHeader = `Bearer ${response.body.access_token}`;
  });

  afterAll(async () => {
    if (genreIds.length) {
      await dataSource.getRepository(Genre).delete(genreIds);
    }
    await dataSource.getRepository(User).delete({ email: testingEmail });
    await app.close();
  });

  describe('POST /api/genres', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: CreateGenreDto = { description: uniqueWord('Genre') };

      const response = await request(app.getHttpServer())
        .post('/api/genres')
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('creates a genre and capitalizes its name', async () => {
      const payload: CreateGenreDto = { description: uniqueWord('Genre') };

      const response = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);

      genreIds.push(response.body.id);
      expectGenreShape(response.body);
      expect(response.body.genre).toBe(capitalize(payload.description));
    });

    it('rejects a duplicate genre name', async () => {
      const payload: CreateGenreDto = { description: uniqueWord('Genre') };

      const first = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      genreIds.push(first.body.id);

      const response = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/genres (DTO validation)', () => {
    it('rejects an empty description', async () => {
      const payload: CreateGenreDto = { description: '' };

      const response = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'description must be longer than or equal to 1 characters',
      );
    });

    it('rejects a description longer than 50 characters', async () => {
      const payload: CreateGenreDto = { description: 'a'.repeat(51) };

      const response = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'description must be shorter than or equal to 50 characters',
      );
    });

    it('rejects a description that is not a string', async () => {
      const payload = { description: 123 } as unknown as CreateGenreDto;

      const response = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('description must be a string');
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        description: uniqueWord('Genre'),
        extraField: 'not allowed',
      } as unknown as CreateGenreDto;

      const response = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('GET /api/genres', () => {
    it('is public and returns a list of genres', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/genres')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      (response.body as Record<string, unknown>[]).forEach((genre) =>
        expectGenreShape(genre),
      );
    });
  });

  describe('GET /api/genres/:id', () => {
    it('is public and returns the created genre', async () => {
      const payload: CreateGenreDto = { description: uniqueWord('Genre') };

      const created = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      genreIds.push(created.body.id);

      const response = await request(app.getHttpServer())
        .get(`/api/genres/${created.body.id}`)
        .expect(200);

      expectGenreShape(response.body);
      expect(response.body.id).toBe(created.body.id);
      expect(response.body.genre).toBe(capitalize(payload.description));
    });

    it('returns 404 for an unknown id', async () => {
      const unknownId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/api/genres/${unknownId}`)
        .expect(404);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `Genre with id ${unknownId} not found`,
      );
    });
  });

  describe('PATCH /api/genres/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: CreateGenreDto = { description: uniqueWord('Genre') };

      const created = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      genreIds.push(created.body.id);

      const update: UpdateGenreDto = { description: uniqueWord('Genre') };

      const response = await request(app.getHttpServer())
        .patch(`/api/genres/${created.body.id}`)
        .send(update)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('returns the genre unchanged when the body is empty', async () => {
      const payload: CreateGenreDto = { description: uniqueWord('Genre') };

      const created = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      genreIds.push(created.body.id);

      const response = await request(app.getHttpServer())
        .patch(`/api/genres/${created.body.id}`)
        .set('Authorization', authHeader)
        .send({})
        .expect(200);

      expectGenreShape(response.body);
      expect(response.body.id).toBe(created.body.id);
      expect(response.body.genre).toBe(created.body.genre);
    });

    it('updates the genre', async () => {
      const payload: CreateGenreDto = { description: uniqueWord('Genre') };

      const created = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      genreIds.push(created.body.id);

      const update: UpdateGenreDto = { description: uniqueWord('Genre') };

      const response = await request(app.getHttpServer())
        .patch(`/api/genres/${created.body.id}`)
        .set('Authorization', authHeader)
        .send(update)
        .expect(200);

      expectGenreShape(response.body);
      expect(response.body.id).toBe(created.body.id);
      expect(response.body.genre).toBe(capitalize(update.description!));
    });
  });

  describe('PATCH /api/genres/:id (DTO validation)', () => {
    const existingId = '00000000-0000-0000-0000-000000000000';

    it('rejects an empty description', async () => {
      const payload: UpdateGenreDto = { description: '' };

      const response = await request(app.getHttpServer())
        .patch(`/api/genres/${existingId}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'description must be longer than or equal to 1 characters',
      );
    });

    it('rejects a description longer than 50 characters', async () => {
      const payload: UpdateGenreDto = { description: 'a'.repeat(51) };

      const response = await request(app.getHttpServer())
        .patch(`/api/genres/${existingId}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'description must be shorter than or equal to 50 characters',
      );
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        extraField: 'not allowed',
      } as unknown as UpdateGenreDto;

      const response = await request(app.getHttpServer())
        .patch(`/api/genres/${existingId}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('DELETE /api/genres/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: CreateGenreDto = { description: uniqueWord('Genre') };

      const created = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      genreIds.push(created.body.id);

      const response = await request(app.getHttpServer())
        .delete(`/api/genres/${created.body.id}`)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('removes the genre', async () => {
      const payload: CreateGenreDto = { description: uniqueWord('Genre') };

      const created = await request(app.getHttpServer())
        .post('/api/genres')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);

      const deleted = await request(app.getHttpServer())
        .delete(`/api/genres/${created.body.id}`)
        .set('Authorization', authHeader)
        .expect(200);

      expectGenreShape(deleted.body);
      expect(deleted.body.id).toBe(created.body.id);

      const notFound = await request(app.getHttpServer())
        .get(`/api/genres/${created.body.id}`)
        .expect(404);

      expect(typeof notFound.body.message).toBe('string');
      expect(notFound.body.message).toBe(
        `Genre with id ${created.body.id} not found`,
      );
    });
  });
});
