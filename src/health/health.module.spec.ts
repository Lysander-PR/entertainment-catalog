import { MODULE_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';

// FilesModule -> SupabaseService reads envs on load.
jest.mock('@/config/envs', () => ({
  envs: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    SUPABASE_BUCKET: 'test-bucket',
  },
  isProd: false,
}));

import { HealthModule } from './health.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { ProbeHealthIndicator } from './indicators/probe.health';
import { CommonModule } from '@/common/common.module';
import { FilesModule } from '@/files/files.module';

describe('HealthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: {} }],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should register HealthController', () => {
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      HealthModule,
    );

    expect(controllers).toContain(HealthController);
    expect(module.get<HealthController>(HealthController)).toBeDefined();
  });

  it('should register HealthService and ProbeHealthIndicator', () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      HealthModule,
    );

    expect(providers).toContain(HealthService);
    expect(providers).toContain(ProbeHealthIndicator);
  });

  it('should import TerminusModule for the health indicators', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, HealthModule);

    expect(imports).toContain(TerminusModule);
  });

  it('should import CommonModule to use CacheService', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, HealthModule);

    expect(imports).toContain(CommonModule);
  });

  it('should import FilesModule to use the storage service', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, HealthModule);

    expect(imports).toContain(FilesModule);
  });
});
