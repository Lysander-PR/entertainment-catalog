import { MODULE_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('@/config/envs', () => ({
  envs: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    SUPABASE_BUCKET: 'test-bucket',
  },
  isProd: false,
}));

import { CommonModule } from './common.module';
import { CommonService } from './common.service';
import { FilesModule } from '@/files/files.module';

describe('CommonModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: CommonService,
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

  it('should register CommonService', () => {
    const service = module.get<CommonService>(CommonService);
    expect(service).toBeDefined();
  });

  it('should import FilesModule', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, CommonModule);
    expect(imports).toContain(FilesModule);
  });

  it('should export CommonService', () => {
    const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, CommonModule);
    expect(exports).toContain(CommonService);
  });
});
