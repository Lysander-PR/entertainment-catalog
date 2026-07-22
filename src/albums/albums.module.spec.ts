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

import { AlbumsModule } from './albums.module';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { CommonModule } from '@/common/common.module';

describe('AlbumsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AlbumsController],
      providers: [
        {
          provide: AlbumsService,
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

  it('should register AlbumsController', () => {
    const controller = module.get<AlbumsController>(AlbumsController);
    expect(controller).toBeDefined();
  });

  it('should register AlbumsService', () => {
    const service = module.get<AlbumsService>(AlbumsService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule for the Album entity', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AlbumsModule);
    const typeOrmImport = imports.find(
      (imp: { module?: unknown }) => imp.module === TypeOrmModule,
    );

    expect(typeOrmImport).toBeDefined();
  });

  it('should import CommonModule', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AlbumsModule);
    expect(imports).toContain(CommonModule);
  });

  it('should export AlbumsService', () => {
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, AlbumsModule);
    expect(exports).toContain(AlbumsService);
  });
});
