import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppModule } from '@/app.module';
import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';
import {
  IStorageService,
  STORAGE_SERVICE,
} from '@/common/interfaces/storage.interface';

export interface TestApp {
  app: INestApplication;
  moduleFixture: TestingModule;
}

export const mockStorageService: IStorageService = {
  upload: jest
    .fn()
    .mockImplementation((_file: Express.Multer.File, fileName: string) =>
      Promise.resolve(`mock-storage/${fileName}`),
    ),
  remove: jest.fn().mockResolvedValue(undefined),
  getFile: jest
    .fn()
    .mockResolvedValue(new Blob(['mock-file-content'], { type: 'text/plain' })),
};

const noopInterceptor = {
  intercept: (_context: unknown, next: { handle: () => unknown }) =>
    next.handle(),
};

export async function createTestApp(): Promise<TestApp> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(STORAGE_SERVICE)
    .useValue(mockStorageService)
    .overrideProvider(APP_INTERCEPTOR)
    .useValue(noopInterceptor)
    .compile();

  const app = moduleFixture.createNestApplication();
  app.useLogger(false);
  app.setGlobalPrefix(APP_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  return { app, moduleFixture };
}
