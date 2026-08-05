import { MODULE_METADATA } from '@nestjs/common/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

// CommonModule pulls in FilesModule -> SupabaseService, which reads envs on load.
jest.mock('@/config/envs', () => ({
  envs: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    SUPABASE_BUCKET: 'test-bucket',
  },
  isProd: false,
}));

import { SongsModule } from './songs.module';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { CommonModule } from '@/common/common.module';

describe('SongsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [SongsController],
      providers: [
        {
          provide: SongsService,
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

  it('should register SongsController', () => {
    const controller = module.get<SongsController>(SongsController);
    expect(controller).toBeDefined();
  });

  it('should register SongsService', () => {
    const service = module.get<SongsService>(SongsService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule for the Song entity', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, SongsModule);
    const typeOrmImport = imports.find(
      (imp: { module?: unknown }) => imp.module === TypeOrmModule,
    );

    expect(typeOrmImport).toBeDefined();
  });

  it('should import CommonModule to reach CacheService', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, SongsModule);
    expect(imports).toContain(CommonModule);
  });

  it('should export SongsService', () => {
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, SongsModule);
    expect(exports).toContain(SongsService);
  });
});
