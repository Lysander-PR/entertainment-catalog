/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource, In } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { isUUID } from 'class-validator';

import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { UpdateUserDto } from '@/user/dto/update-user.dto';
import { createTestApp } from './utils/test-app.util';
import { Roles } from '@/user/types/enums/roles.enum';

const testingEmail = 'user.testing.user@google.com';
const createdEmail = 'user.testing.created@google.com';
const otherEmail = 'user.testing.other@google.com';
const tempEmail = 'user.testing.temp@google.com';

const expectUserShape = (body: Record<string, unknown>) => {
  expect(body).toEqual(
    expect.objectContaining({
      id: expect.any(String),
      email: expect.any(String),
      username: expect.any(String),
      rol: expect.any(String),
    }),
  );
  expect(isUUID(body.id as string)).toBe(true);
  expect(body).not.toHaveProperty('password');
  expect(body).not.toHaveProperty('verified');
  expect(body).not.toHaveProperty('active');
};

describe('User (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let authUser: { id: string; email: string; username: string };
  let authHeader: string;

  beforeAll(async () => {
    ({ app, moduleFixture } = await createTestApp());
    dataSource = moduleFixture.get(DataSource);

    await dataSource.getRepository(User).delete({
      email: In([testingEmail, createdEmail, otherEmail, tempEmail]),
    });

    const registerPayload: CreateUserDto = {
      email: testingEmail,
      username: 'user-testing-user',
      password: 'Str0ng!Pass1',
    };

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registerPayload)
      .expect(201);

    authUser = response.body.user;
    authHeader = `Bearer ${response.body.access_token}`;
  });

  afterAll(async () => {
    await dataSource.getRepository(User).delete({
      email: In([testingEmail, createdEmail, otherEmail, tempEmail]),
    });
    await app.close();
  });

  describe('POST /api/user', () => {
    it('creates a user without exposing the password', async () => {
      const payload: CreateUserDto = {
        email: createdEmail,
        username: 'user-testing-created',
        password: 'Str0ng!Pass1',
      };

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(201);

      expectUserShape(response.body);
      expect(response.body.email).toBe(payload.email);
      expect(response.body.username).toBe(payload.username);
      expect(response.body.rol).toBe(Roles.USER);
    });

    it('rejects a duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send({
          email: authUser.email,
          username: 'user-testing-dup-email',
          password: 'Str0ng!Pass1',
        })
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `The email ${authUser.email} belongs to another user`,
      );
    });

    it('rejects a duplicate username', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send({
          email: 'user.testing.dup.username@google.com',
          username: authUser.username,
          password: 'Str0ng!Pass1',
        })
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `User with username ${authUser.username} already exists`,
      );
    });
  });

  describe('POST /api/user (DTO validation)', () => {
    it('rejects an invalid email', async () => {
      const payload: CreateUserDto = {
        email: 'not-an-email',
        username: 'user-testing-invalid-email',
        password: 'Str0ng!Pass1',
      };

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('email must be an email');
    });

    it('rejects an email longer than 50 characters', async () => {
      const payload: CreateUserDto = {
        email: `${'a'.repeat(45)}@example.com`,
        username: 'user-testing-long-email',
        password: 'Str0ng!Pass1',
      };

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'email must be shorter than or equal to 50 characters',
      );
    });

    it('rejects a username with spaces', async () => {
      const payload: CreateUserDto = {
        email: 'user.testing.spaces@google.com',
        username: 'user testing spaces',
        password: 'Str0ng!Pass1',
      };

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'The username cannot contain spaces',
      );
    });

    it('rejects a username longer than 30 characters', async () => {
      const payload: CreateUserDto = {
        email: 'user.testing.long.username@google.com',
        username: 'a'.repeat(31),
        password: 'Str0ng!Pass1',
      };

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'username must be shorter than or equal to 30 characters',
      );
    });

    it('rejects an empty username', async () => {
      const payload: CreateUserDto = {
        email: 'user.testing.empty.username@google.com',
        username: '',
        password: 'Str0ng!Pass1',
      };

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'username must be longer than or equal to 1 characters',
      );
    });

    it('rejects a weak password', async () => {
      const payload: CreateUserDto = {
        email: 'user.testing.weak@google.com',
        username: 'user-testing-weak',
        password: 'weak',
      };

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'Password must be stronger: 6+ chars with at least one upper, one lower, one number and one symbol',
      );
    });

    it('rejects a password that is not a string', async () => {
      const payload = {
        email: 'user.testing.numeric.password@google.com',
        username: 'user-testing-numeric-pass',
        password: 53454354,
      } as unknown as CreateUserDto;

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('password must be a string');
    });

    it('rejects a missing password', async () => {
      const payload = {
        email: 'user.testing.missing.password@google.com',
        username: 'user-testing-missing-pass',
      } as unknown as CreateUserDto;

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('password should not be empty');
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        email: 'user.testing.extra@google.com',
        username: 'user-testing-extra',
        password: 'Str0ng!Pass1',
        extraField: 'not allowed',
      } as unknown as CreateUserDto;

      const response = await request(app.getHttpServer())
        .post('/api/user')
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('GET /api/user/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/user/${authUser.id}`)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('rejects an invalid uuid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/user/not-a-uuid')
        .set('Authorization', authHeader)
        .expect(400);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        'Validation failed (uuid is expected)',
      );
    });

    it('returns 404 for an unknown id', async () => {
      const unknownId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/api/user/${unknownId}`)
        .set('Authorization', authHeader)
        .expect(404);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(`User with id ${unknownId} not found`);
    });

    it('returns the user when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/user/${authUser.id}`)
        .set('Authorization', authHeader)
        .expect(200);

      expectUserShape(response.body);
      expect(response.body.id).toBe(authUser.id);
      expect(response.body.email).toBe(authUser.email);
    });
  });

  describe('PATCH /api/user/:id', () => {
    it('rejects unauthenticated requests', async () => {
      const payload: UpdateUserDto = { username: 'user-testing-renamed' };

      const response = await request(app.getHttpServer())
        .patch(`/api/user/${authUser.id}`)
        .send(payload)
        .expect(401);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Unauthorized');
    });

    it('returns the user unchanged when the body is empty', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/user/${authUser.id}`)
        .set('Authorization', authHeader)
        .send({})
        .expect(200);

      expectUserShape(response.body);
      expect(response.body.id).toBe(authUser.id);
      expect(response.body.email).toBe(authUser.email);
      expect(response.body.username).toBe(authUser.username);
    });

    it('rejects an email already used by another user', async () => {
      const otherUser: CreateUserDto = {
        email: otherEmail,
        username: 'user-testing-other',
        password: 'Str0ng!Pass1',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(otherUser)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/api/user/${authUser.id}`)
        .set('Authorization', authHeader)
        .send({ email: otherUser.email })
        .expect(409);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe(
        `The email ${otherUser.email} belongs to another user`,
      );
    });

    it('updates the username', async () => {
      const payload: UpdateUserDto = { username: 'user-testing-renamed' };

      const response = await request(app.getHttpServer())
        .patch(`/api/user/${authUser.id}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(200);

      expectUserShape(response.body);
      expect(response.body.id).toBe(authUser.id);
      expect(response.body.username).toBe(payload.username);
      authUser.username = payload.username!;
    });
  });

  describe('PATCH /api/user/:id (DTO validation)', () => {
    it('rejects an invalid email', async () => {
      const payload: UpdateUserDto = { email: 'not-an-email' };

      const response = await request(app.getHttpServer())
        .patch(`/api/user/${authUser.id}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('email must be an email');
    });

    it('rejects a username with spaces', async () => {
      const payload: UpdateUserDto = { username: 'user testing spaces' };

      const response = await request(app.getHttpServer())
        .patch(`/api/user/${authUser.id}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'The username cannot contain spaces',
      );
    });

    it('rejects a non-whitelisted property', async () => {
      const payload = {
        extraField: 'not allowed',
      } as unknown as UpdateUserDto;

      const response = await request(app.getHttpServer())
        .patch(`/api/user/${authUser.id}`)
        .set('Authorization', authHeader)
        .send(payload)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'property extraField should not exist',
      );
    });
  });

  describe('DELETE /api/user/:id', () => {
    it('deletes, then reactivates a temporary user', async () => {
      const tempUser: CreateUserDto = {
        email: tempEmail,
        username: 'user-testing-temp',
        password: 'Str0ng!Pass1',
      };

      const tempResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(tempUser)
        .expect(201);
      const tempId = tempResponse.body.user.id;

      const deleted = await request(app.getHttpServer())
        .delete(`/api/user/${tempId}`)
        .set('Authorization', authHeader)
        .expect(200);

      expectUserShape(deleted.body);
      expect(deleted.body.id).toBe(tempId);

      const notFound = await request(app.getHttpServer())
        .get(`/api/user/${tempId}`)
        .set('Authorization', authHeader)
        .expect(404);

      expect(typeof notFound.body.message).toBe('string');
      expect(notFound.body.message).toBe(`User with id ${tempId} not found`);

      const reactivated = await request(app.getHttpServer())
        .post('/api/user/reactivate')
        .set('Authorization', authHeader)
        .send({ id: tempId })
        .expect(201);

      expectUserShape(reactivated.body);
      expect(reactivated.body.id).toBe(tempId);

      const restored = await request(app.getHttpServer())
        .get(`/api/user/${tempId}`)
        .set('Authorization', authHeader)
        .expect(200);

      expectUserShape(restored.body);
      expect(restored.body.id).toBe(tempId);
    });
  });
});
