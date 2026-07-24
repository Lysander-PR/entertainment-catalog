/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { isUUID } from 'class-validator';

import { Book } from '@/books/entities/book.entity';
import { CreateBookDto } from '@/books/dto/create-book.dto';
import { UpdateBookDto } from '@/books/dto/update-book.dto';
import { Cover } from '@/files/entities/cover.entity';
import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { createTestApp } from './utils/test-app.util';
import { uniqueWord } from './utils/fixtures.util';
import { capitalize } from '@/common/helpers/capitalize.helper';

const testingUser: CreateUserDto = {
  email: 'books.testing.user@google.com',
  username: 'books-testing-user',
  password: 'Str0ng!Pass1',
};

const expectBookShape = (body: Record<string, unknown>) => {
  expect(body).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      author: expect.any(String),
      title: expect.any(String),
      releaseDate: expect.any(String),
      publisher: expect.any(String),
      createdAt: expect.any(String),
    }),
  );
  expect(isUUID(body.id as string)).toBe(true);
  expect(body).not.toHaveProperty('active');
};

describe('Books (e2e)', () => {
  let appTest: INestApplication<App>;
  let dataSource: DataSource;
  let authHeader: string;
  const bookIds: string[] = [];
  const coverIds: string[] = [];

  beforeAll(async () => {
    const { moduleFixture, app } = await createTestApp();
    dataSource = moduleFixture.get(DataSource);
    appTest = app;

    await dataSource.getRepository(User).delete({ email: testingUser.email });

    const response = await request(appTest.getHttpServer())
      .post('/api/auth/register')
      .send(testingUser)
      .expect(201);

    authHeader = `Bearer ${response.body.access_token}`;
  });

  afterAll(async () => {
    // if (bookIds.length) {
    //   await dataSource.getRepository(Book).delete(bookIds);
    // }
    // if (coverIds.length) {
    //   await dataSource.getRepository(Cover).delete(coverIds);
    // }
    // await dataSource.getRepository(User).delete({ email: testingUser.email });
    await appTest.close();
  });

  describe('POST /api/books', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('rejects an author with digits', async () => {
      const payload: CreateBookDto = {
        author: 'Author123',
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        `author must contain only letters and spaces: ${payload.author}`,
      );
    });

    it('creates a book and capitalizes its text fields', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        coWriter: uniqueWord('CoWriter'),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);

      bookIds.push(response.body.id);
      expectBookShape(response.body);
      expect(response.body).toEqual(
        expect.objectContaining({
          author: capitalize(payload.author),
          coWriter: capitalize(payload.coWriter!),
          title: capitalize(payload.title),
          publisher: capitalize(payload.publisher),
        }),
      );
    });

    it('rejects a duplicate title and author', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const first = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      bookIds.push(first.body.id);

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send({ ...payload, publisher: 'Another Publisher' })
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `Book with title "${payload.title}" and author "${payload.author}" already exists`,
      );
    });

    it('accepts a JPEG cover through the storage service', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .field('author', payload.author)
        .field('title', payload.title)
        .field('releaseDate', payload.releaseDate.toISOString())
        .field('publisher', payload.publisher)
        .attach('cover', Buffer.from([0xff, 0xd8, 0xff]), {
          filename: 'cover.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      bookIds.push(response.body.id);
      coverIds.push(response.body.coverId);
      expectBookShape(response.body);
      expect(response.body.coverId).toBeDefined();
      expect(isUUID(response.body.coverId)).toBe(true);
    });

    it('rejects a non-JPEG cover', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .field('author', payload.author)
        .field('title', payload.title)
        .field('releaseDate', payload.releaseDate.toISOString())
        .field('publisher', payload.publisher)
        .attach('cover', Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
          filename: 'cover.png',
          contentType: 'image/png',
        })
        .expect(400);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        'File type image/png is not allowed. Allowed types: image/jpeg',
      );
    });
  });

  describe('POST /api/books (DTO validation)', () => {
    it('rejects an author longer than 30 characters', async () => {
      const payload: CreateBookDto = {
        author: 'a'.repeat(31),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'author must be shorter than or equal to 30 characters',
      );
    });

    it('rejects an empty author', async () => {
      const payload: CreateBookDto = {
        author: '',
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'author must be longer than or equal to 1 characters',
      );
    });

    it('rejects an author that is not a string', async () => {
      const payload = {
        author: 123,
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      } as unknown as CreateBookDto;

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('author must be a string');
    });

    it('rejects a coWriter with digits', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        coWriter: 'CoWriter123',
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        `coWriter must contain only letters and spaces: ${payload.coWriter}`,
      );
    });

    it('rejects a coWriter longer than 30 characters', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        coWriter: 'a'.repeat(31),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'coWriter must be shorter than or equal to 30 characters',
      );
    });

    it('rejects a title longer than 50 characters', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        title: 'a'.repeat(51),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'title must be shorter than or equal to 50 characters',
      );
    });

    it('rejects an empty title', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        title: '',
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'title must be longer than or equal to 1 characters',
      );
    });

    it('rejects a title that is not a string', async () => {
      const payload = {
        author: uniqueWord('Author'),
        title: 123,
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      } as unknown as CreateBookDto;

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('title must be a string');
    });

    it('rejects a publisher longer than 50 characters', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'a'.repeat(51),
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'publisher must be shorter than or equal to 50 characters',
      );
    });

    it('rejects an empty publisher', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: '',
      };

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'publisher must be longer than or equal to 1 characters',
      );
    });

    it('rejects an invalid release date', async () => {
      const payload = {
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        releaseDate: 'not-a-date',
        publisher: 'Publisher',
      } as unknown as CreateBookDto;

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
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
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        publisher: 'Publisher',
      } as unknown as CreateBookDto;

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'releaseDate must be a Date instance',
      );
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
        extraField: 'not allowed',
      } as unknown as CreateBookDto;

      const response = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('GET /api/books', () => {
    it('is public and returns a list of books', async () => {
      const response = await request(appTest.getHttpServer())
        .get('/api/books')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      (response.body as Record<string, unknown>[]).forEach((book) =>
        expectBookShape(book),
      );
    });
  });

  describe('GET /api/books/:id', () => {
    it('returns 404 for an unknown id', async () => {
      const unknownId = '00000000-0000-0000-0000-000000000000';

      const response = await request(appTest.getHttpServer())
        .get(`/api/books/${unknownId}`)
        .expect(404);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(`Book with id ${unknownId} not found`);
    });

    it('returns the created book', async () => {
      const response = await request(appTest.getHttpServer())
        .get(`/api/books/${bookIds[0]}`)
        .expect(200);

      expectBookShape(response.body);
      expect(response.body.id).toBe(bookIds[0]);
    });
  });

  describe('PATCH /api/books/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: UpdateBookDto = { publisher: 'New Publisher' };

      const response = await request(appTest.getHttpServer())
        .patch(`/api/books/${bookIds[0]}`)
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('updates the publisher', async () => {
      const payload: UpdateBookDto = { publisher: 'New Publisher' };

      const response = await request(appTest.getHttpServer())
        .patch(`/api/books/${bookIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(200);

      expectBookShape(response.body);
      expect(response.body.id).toBe(bookIds[0]);
      expect(response.body.publisher).toBe(capitalize(payload.publisher!));
    });
  });

  describe('PATCH /api/books/:id (DTO validation)', () => {
    it('rejects an author with digits', async () => {
      const payload: UpdateBookDto = { author: 'Author123' };

      const response = await request(appTest.getHttpServer())
        .patch(`/api/books/${bookIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        `author must contain only letters and spaces: ${payload.author}`,
      );
    });

    it('rejects a title longer than 50 characters', async () => {
      const payload: UpdateBookDto = { title: 'a'.repeat(51) };

      const response = await request(appTest.getHttpServer())
        .patch(`/api/books/${bookIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'title must be shorter than or equal to 50 characters',
      );
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        extraField: 'not allowed',
      } as unknown as UpdateBookDto;

      const response = await request(appTest.getHttpServer())
        .patch(`/api/books/${bookIds[0]}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(appTest.getHttpServer())
        .delete(`/api/books/${bookIds[0]}`)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('deletes, then reactivates a temporary book', async () => {
      const payload: CreateBookDto = {
        author: uniqueWord('Author'),
        title: uniqueWord('Title'),
        releaseDate: new Date('1967-05-30'),
        publisher: 'Publisher',
      };

      const created = await request(appTest.getHttpServer())
        .post('/api/books')
        .set('Authorization', authHeader)
        .send(payload)
        .expect(201);
      bookIds.push(created.body.id);
      expectBookShape(created.body);

      const deleted = await request(appTest.getHttpServer())
        .delete(`/api/books/${created.body.id}`)
        .set('Authorization', authHeader)
        .expect(200);

      expectBookShape(deleted.body);
      expect(deleted.body.id).toBe(created.body.id);

      const notFound = await request(appTest.getHttpServer())
        .get(`/api/books/${created.body.id}`)
        .expect(404);

      expect(typeof notFound.body.message).toBe('string');
      expect(notFound.body.message).toBe(
        `Book with id ${created.body.id} not found`,
      );

      const reactivated = await request(appTest.getHttpServer())
        .post('/api/books/reactivate')
        .set('Authorization', authHeader)
        .send({ id: created.body.id })
        .expect(201);

      expectBookShape(reactivated.body);
      expect(reactivated.body.id).toBe(created.body.id);

      const restored = await request(appTest.getHttpServer())
        .get(`/api/books/${created.body.id}`)
        .expect(200);

      expectBookShape(restored.body);
      expect(restored.body.id).toBe(created.body.id);
    });
  });
});
