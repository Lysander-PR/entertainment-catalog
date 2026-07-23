/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';

import { AppModule } from '@/app.module';
import { User } from '@/user/entities/user.entity';
import { LoginDto } from '@/auth/dto/login-auth.dto';
import { Roles } from '@/user/types/enums/roles.enum';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';

const testingUser = {
  email: 'auth.testing.user@google.com',
  password: 'Str0ng!Pass1',
  username: 'auth-testing-user',
};

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(APP_PREFIX);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await userRepository.delete({ email: testingUser.email });
    await app.close();
  });

  describe('POST /register', () => {
    beforeEach(async () => {
      await userRepository.delete({ email: testingUser.email });
    });

    it('POST /api/auth/register creates a user and returns an access token', async () => {
      const payload: CreateUserDto = {
        email: testingUser.email.toUpperCase(),
        username: testingUser.username,
        password: testingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(201);

      expect(response.body.user.email).toBe(payload.email.toLowerCase());
      expect(response.body.user.password).toBeUndefined();
      expect(typeof response.body.access_token).toBe('string');
    });

    it('POST /api/auth/register rejects a duplicate email', async () => {
      const payload: CreateUserDto = {
        email: testingUser.email,
        username: testingUser.username,
        password: testingUser.password,
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...payload, username: 'uniqueUsername@email.com' })
        .expect(409);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBe(
        `The email ${payload.email} belongs to another user`,
      );
    });

    it('POST /api/auth/register property email exceeds max length', async () => {
      const payload: CreateUserDto = {
        email: `${'a'.repeat(45)}@example.com`,
        username: testingUser.username,
        password: testingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'email must be shorter than or equal to 50 characters',
      );
    });

    it('POST /api/auth/register property email is not a valid email', async () => {
      const payload: CreateUserDto = {
        email: 'not-an-email',
        username: testingUser.username,
        password: testingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('email must be an email');
    });

    it('POST /api/auth/register property username contains spaces', async () => {
      const payload: CreateUserDto = {
        email: testingUser.email,
        username: 'testing user',
        password: testingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'The username cannot contain spaces',
      );
    });

    it('POST /api/auth/register property username exceeds max length', async () => {
      const payload: CreateUserDto = {
        email: testingUser.email,
        username: 'a'.repeat(31),
        password: testingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'username must be shorter than or equal to 30 characters',
      );
    });

    it('POST /api/auth/register property username is shorter than min length', async () => {
      const payload: CreateUserDto = {
        email: testingUser.email,
        username: '',
        password: testingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'username must be longer than or equal to 1 characters',
      );
    });

    it('POST /api/auth/register property password is not strong enough', async () => {
      const payload: CreateUserDto = {
        email: testingUser.email,
        username: testingUser.username,
        password: 'password',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain(
        'Password must be stronger: 6+ chars with at least one upper, one lower, one number and one symbol',
      );
    });

    it('POST /api/auth/register property password is not a string', async () => {
      const payload = {
        email: testingUser.email,
        username: testingUser.username,
        password: 53454354,
      } as unknown as CreateUserDto;

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('password must be a string');
    });

    it('POST /api/auth/register property password is missing', async () => {
      const payload = {
        email: testingUser.email,
        username: testingUser.username,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('password should not be empty');
    });
  });

  describe('POST /login', () => {
    beforeAll(async () => {
      await userRepository.delete({ email: testingUser.email });
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testingUser);
    });

    afterAll(async () => {
      await userRepository.delete({ email: testingUser.email });
    });

    it('POST /api/auth/login logs in with valid credentials', async () => {
      const credentials: LoginDto = {
        email: testingUser.email,
        password: testingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(credentials)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body.user).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
          username: expect.any(String),
          rol: expect.any(String),
        }),
      );
      expect(Object.values(Roles)).toContain(response.body.user.rol);
    });

    it('POST /api/auth/login rejects an unknown email', async () => {
      const credentials: LoginDto = {
        email: 'unknown@email.com',
        password: testingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBe('Credentials are not valid');
    });

    it('POST /api/auth/login rejects a wrong password', async () => {
      const credentials: LoginDto = {
        email: testingUser.email,
        password: 'wrong-password',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBe('Credentials are not valid');
    });

    it('POST /api/auth/login property email is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ password: testingUser.password })
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('email should not be empty');
    });

    it('POST /api/auth/login property email is a string', async () => {
      const credentials: LoginDto = {
        email: 5445 as unknown as string,
        password: testingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('email must be an email');
    });

    it('POST /api/auth/login property password is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testingUser.email })
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('password should not be empty');
    });

    it('POST /api/auth/login property password is a string', async () => {
      const credentials: LoginDto = {
        email: testingUser.email,
        password: 53454354 as unknown as string,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body?.message).toBeDefined();
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('password must be a string');
    });
  });
});
