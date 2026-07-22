import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MODULE_METADATA } from '@nestjs/common/constants';

jest.mock('@/config/envs', () => ({
  envs: { JWT_SECRET: 'test-secret' },
  isProd: false,
}));

import { AuthModule } from './auth.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JWT_SECRET } from './types/consts/auth.const';
import { UserModule } from '@/user/user.module';
import { Test, TestingModule } from '@nestjs/testing';
import { envs } from '@/config/envs';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          global: true,
          secret: envs.JWT_SECRET,
          signOptions: { expiresIn: '2h' },
        }),
      ],
      providers: [
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: JwtStrategy,
          useValue: {},
        },
        {
          provide: JWT_SECRET,
          useValue: envs.JWT_SECRET,
        },
      ],
      controllers: [AuthController],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should register AuthController', () => {
    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should register AuthService', () => {
    const authService = module.get<AuthService>(AuthService);
    expect(authService).toBeDefined();
  });

  it('should provide JwtStrategy', () => {
    const provider = module.get<JwtStrategy>(JwtStrategy);
    expect(provider).toBeDefined();
  });

  it('should provide JWT_SECRET', () => {
    const providers = module.get(JWT_SECRET);
    expect(providers).toBe(envs.JWT_SECRET);
  });

  it('should import UserModule', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AuthModule);
    expect(imports).toContain(UserModule);
  });

  it('should provide PassportModule', () => {
    const passport = module.get<PassportModule>(PassportModule);
    expect(passport).toBeDefined();
  });

  it('should provide JwtModule', () => {
    const jwtImport = module.get<JwtModule>(JwtModule);
    expect(jwtImport).toBeDefined();
  });
});
