import { MODULE_METADATA } from '@nestjs/common/constants';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { GenresModule } from './genres.module';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';

describe('GenresModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [GenresController],
      providers: [
        {
          provide: GenresService,
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

  it('should register GenresController', () => {
    const controller = module.get<GenresController>(GenresController);
    expect(controller).toBeDefined();
  });

  it('should register GenresService', () => {
    const service = module.get<GenresService>(GenresService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule for the Genre entity', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, GenresModule);
    const typeOrmImport = imports.find(
      (imp: { module?: unknown }) => imp.module === TypeOrmModule,
    );

    expect(typeOrmImport).toBeDefined();
  });

  it('should export GenresService', () => {
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, GenresModule);
    expect(exports).toContain(GenresService);
  });
});
