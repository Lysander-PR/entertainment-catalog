import { MODULE_METADATA } from '@nestjs/common/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { SongsModule } from './songs.module';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';

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

  it('should export SongsService', () => {
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, SongsModule);
    expect(exports).toContain(SongsService);
  });
});
