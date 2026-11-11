import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';

import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { Roles } from '@/user/types/enums/roles.enum';
import { createTestApp, mockStorageService } from './utils/test-app.util';

const adminEmail = 'health.testing.admin@google.com';
const userEmail = 'health.testing.user@google.com';
const nonAdminUsername = 'health-testing-user';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;
  let moduleFixture: TestingModule;
  let dataSource: DataSource;
  let adminAuthHeader: string;
  let userAuthHeader: string;

  // ping is already a jest.fn(), so spyOn returns that same mock, typed.
  const storagePing = jest.spyOn(mockStorageService, 'ping');

  beforeAll(async () => {
    ({ app, moduleFixture } = await createTestApp());
    dataSource = moduleFixture.get(DataSource);

    await dataSource.getRepository(User).delete({ email: adminEmail });
    await dataSource.getRepository(User).delete({ email: userEmail });

    const adminPayload: CreateUserDto = {
      email: adminEmail,
      username: 'health-testing-admin',
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

  afterEach(() => {
    storagePing.mockReset();
    storagePing.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await dataSource.getRepository(User).delete({ email: adminEmail });
    await dataSource.getRepository(User).delete({ email: userEmail });
    await app.close();
  });

  describe('GET /api/health/live', () => {
    it('returns 200 with an ok status without requiring authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/live')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
      expect(response.headers['cache-control']).toContain('no-store');
    });

    it('does not check the dependencies', async () => {
      await request(app.getHttpServer()).get('/api/health/live').expect(200);

      expect(storagePing).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/health/ready', () => {
    it('returns 200 with an ok status when all dependencies are healthy', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
      expect(response.headers['cache-control']).toContain('no-store');
      expect(storagePing).toHaveBeenCalledTimes(1);
    });

    it('returns 503 with only the overall status when a dependency fails', async () => {
      storagePing.mockRejectedValueOnce(new Error('Bucket not found'));

      const response = await request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(503);

      expect(response.body).toEqual({ status: 'error' });
    });
  });

  describe('GET /api/health/details', () => {
    it('rejects unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/details')
        .expect(401);

      expect(response.body.message).toBe('Unauthorized');
      expect(storagePing).not.toHaveBeenCalled();
    });

    it('rejects a user who is not an ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/details')
        .set('Authorization', userAuthHeader)
        .expect(403);

      expect(response.body.message).toBe(
        `User ${nonAdminUsername} needs a valid role: [${Roles.ADMIN}]`,
      );
      expect(storagePing).not.toHaveBeenCalled();
    });

    it('returns 200 with the details of each dependency for an ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/details')
        .set('Authorization', adminAuthHeader)
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.details).toEqual({
        database: { status: 'up' },
        cache: { status: 'up' },
        storage: { status: 'up' },
      });
      expect(response.headers['cache-control']).toContain('no-store');
    });

    it('returns 503 indicating the failing dependency for an ADMIN', async () => {
      storagePing.mockRejectedValueOnce(new Error('Bucket not found'));

      const response = await request(app.getHttpServer())
        .get('/api/health/details')
        .set('Authorization', adminAuthHeader)
        .expect(503);

      expect(response.body.status).toBe('error');
      expect(response.body.error).toEqual({
        storage: { status: 'down', message: 'Bucket not found' },
      });
      expect(response.body.info).toEqual({
        database: { status: 'up' },
        cache: { status: 'up' },
      });
    });
  });
});
