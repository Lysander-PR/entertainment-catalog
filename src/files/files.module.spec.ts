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

import { FilesModule } from './files.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { STORAGE_SERVICE } from '@/common/interfaces/storage.interface';

describe('FilesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
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

  it('should register FilesController', () => {
    const controller = module.get<FilesController>(FilesController);
    expect(controller).toBeDefined();
  });

  it('should register FilesService', () => {
    const service = module.get<FilesService>(FilesService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule for the Cover entity', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, FilesModule);
    const typeOrmImport = imports.find(
      (imp: { module?: unknown }) => imp.module === TypeOrmModule,
    );

    expect(typeOrmImport).toBeDefined();
  });

  it('should export FilesService', () => {
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, FilesModule);
    expect(exports).toContain(FilesService);
  });

  it('should export STORAGE_SERVICE', () => {
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, FilesModule);
    expect(exports).toContain(STORAGE_SERVICE);
  });
});
