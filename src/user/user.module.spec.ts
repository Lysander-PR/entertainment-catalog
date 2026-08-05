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

import { UserModule } from './user.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CommonModule } from '@/common/common.module';

describe('UserModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
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

  it('should register UserController', () => {
    const controller = module.get<UserController>(UserController);
    expect(controller).toBeDefined();
  });

  it('should register UserService', () => {
    const service = module.get<UserService>(UserService);
    expect(service).toBeDefined();
  });

  it('should import TypeOrmModule for the User entity', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, UserModule);
    const typeOrmImport = imports.find(
      (imp: { module?: unknown }) => imp.module === TypeOrmModule,
    );

    expect(typeOrmImport).toBeDefined();
  });

  it('should import CommonModule to reach CacheService', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, UserModule);
    expect(imports).toContain(CommonModule);
  });

  it('should export UserService', () => {
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, UserModule);
    expect(exports).toContain(UserService);
  });
});
