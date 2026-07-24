/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { isUUID } from 'class-validator';

import { Cover } from '@/files/entities/cover.entity';
import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { Roles } from '@/user/types/enums/roles.enum';
import { createTestApp } from './utils/test-app.util';

const adminEmail = 'files.testing.admin@google.com';
const userEmail = 'files.testing.user@google.com';
const nonAdminUsername = 'files-testing-user';

const expectCoverShape = (body: Record<string, unknown>) => {
  expect(body).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      file: expect.any(String),
      createdAt: expect.any(String),
    }),
  );
  expect(isUUID(body.id as string)).toBe(true);
};

describe('Files (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let adminAuthHeader: string;
  let userAuthHeader: string;
  const coverIds: string[] = [];

  beforeAll(async () => {
    ({ app, moduleFixture } = await createTestApp());
    dataSource = moduleFixture.get(DataSource);

    await dataSource.getRepository(User).delete({ email: adminEmail });
    await dataSource.getRepository(User).delete({ email: userEmail });

    const adminPayload: CreateUserDto = {
      email: adminEmail,
      username: 'files-testing-admin',
      password: 'Str0ng!Pass1',
    };

    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(adminPayload)
      .expect(201);
    adminAuthHeader = `Bearer ${adminResponse.body.access_token}`;

    await dataSource
      .getRepository(User)
      .update({ id: adminResponse.body.user.id }, { rol: Roles.ADMIN });

    const userPayload: CreateUserDto = {
      email: userEmail,
      username: nonAdminUsername,
      password: 'Str0ng!Pass1',
    };

    const userResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userPayload)
      .expect(201);
    userAuthHeader = `Bearer ${userResponse.body.access_token}`;
  });

  afterAll(async () => {
    if (coverIds.length) {
      await dataSource.getRepository(Cover).delete(coverIds);
    }
    await dataSource.getRepository(User).delete({ email: adminEmail });
    await dataSource.getRepository(User).delete({ email: userEmail });
    await app.close();
  });

  describe('POST /api/files/upload', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/files/upload')
        .attach('file', Buffer.from([0xff, 0xd8, 0xff]), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('rejects a non-ADMIN user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', userAuthHeader)
        .attach('file', Buffer.from([0xff, 0xd8, 0xff]), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `User ${nonAdminUsername} needs a valid role: [${Roles.ADMIN}]`,
      );
    });

    it('rejects a missing file', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', adminAuthHeader)
        .expect(400);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('File is required');
    });

    it('rejects an unsupported mime type', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', adminAuthHeader)
        .attach('file', Buffer.from('plain text content'), {
          filename: 'notes.txt',
          contentType: 'text/plain',
        })
        .expect(400);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        'File type text/plain is not allowed. Allowed types: image/jpeg, image/png, image/gif, image/bmp, image/webp',
      );
    });

    it('creates a cover record through the storage service', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/files/upload')
        .set('Authorization', adminAuthHeader)
        .attach('file', Buffer.from([0xff, 0xd8, 0xff]), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      coverIds.push(response.body.id);
      expectCoverShape(response.body);
      expect(response.body.file).toBe('mock-storage/photo.jpg');
    });
  });

  describe('GET /api/files/:id', () => {
    it('is public and streams the file content', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/files/${coverIds[0]}`)
        .expect(200);

      expect(response.text).toContain('mock-file-content');
    });

    it('returns 404 for an unknown id', async () => {
      const unknownId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/api/files/${unknownId}`)
        .expect(404);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `Cover with id ${unknownId} not found`,
      );
    });
  });

  describe('PATCH /api/files/:id', () => {
    it('rejects a non-ADMIN user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/files/${coverIds[0]}`)
        .set('Authorization', userAuthHeader)
        .attach('file', Buffer.from([0xff, 0xd8, 0xff]), {
          filename: 'photo2.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `User ${nonAdminUsername} needs a valid role: [${Roles.ADMIN}]`,
      );
    });

    it('replaces the file for an ADMIN user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/files/${coverIds[0]}`)
        .set('Authorization', adminAuthHeader)
        .attach('file', Buffer.from([0xff, 0xd8, 0xff]), {
          filename: 'photo2.jpg',
          contentType: 'image/jpeg',
        })
        .expect(200);

      expectCoverShape(response.body);
      expect(response.body.id).toBe(coverIds[0]);
      expect(response.body.file).toBe('mock-storage/photo2.jpg');
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('rejects a non-ADMIN user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/files/${coverIds[0]}`)
        .set('Authorization', userAuthHeader)
        .expect(403);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `User ${nonAdminUsername} needs a valid role: [${Roles.ADMIN}]`,
      );
    });

    it('removes the file for an ADMIN user', async () => {
      const deleted = await request(app.getHttpServer())
        .delete(`/api/files/${coverIds[0]}`)
        .set('Authorization', adminAuthHeader)
        .expect(200);

      expectCoverShape(deleted.body);
      expect(deleted.body.id).toBe(coverIds[0]);

      const notFound = await request(app.getHttpServer())
        .get(`/api/files/${coverIds[0]}`)
        .expect(404);

      expect(typeof notFound.body.message).toBe('string');
      expect(notFound.body.message).toBe(
        `Cover with id ${coverIds[0]} not found`,
      );

      coverIds.pop();
    });
  });
});
