import { MODULE_METADATA } from '@nestjs/common/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@/config/envs', () => ({
  envs: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    SUPABASE_BUCKET: 'test-bucket',
  },
  isProd: false,
}));

import { BooksModule } from './books.module';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { CommonModule } from '@/common/common.module';

describe('BooksModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: {},
        },
      ],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should register BooksController', () => {
    const controller = module.get<BooksController>(BooksController);
    expect(controller).toBeDefined();
  });

  it('should register BooksService', () => {
    const service = module.get<BooksService>(BooksService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule for the Book entity', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, BooksModule);
    const typeOrmImport = imports.find(
      (imp: { module?: unknown }) => imp.module === TypeOrmModule,
    );

    expect(typeOrmImport).toBeDefined();
  });

  it('should import CommonModule', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, BooksModule);
    expect(imports).toContain(CommonModule);
  });
});
