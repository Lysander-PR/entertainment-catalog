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

import { MoviesModule } from './movies.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { CommonModule } from '@/common/common.module';

describe('MoviesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
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

  it('should register MoviesController', () => {
    const controller = module.get<MoviesController>(MoviesController);
    expect(controller).toBeDefined();
  });

  it('should register MoviesService', () => {
    const service = module.get<MoviesService>(MoviesService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule for the Movie entity', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, MoviesModule);
    const typeOrmImport = imports.find(
      (imp: { module?: unknown }) => imp.module === TypeOrmModule,
    );

    expect(typeOrmImport).toBeDefined();
  });

  it('should import CommonModule', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, MoviesModule);
    expect(imports).toContain(CommonModule);
  });
});
