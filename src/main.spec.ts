/* eslint-disable @typescript-eslint/unbound-method */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { bootstrap } from './main';
import { AppModule } from './app.module';
import { APP_PREFIX } from './common/types/consts/app-prefix.const';

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockReturnValue({
    log: jest.fn(),
  }),
  ValidationPipe: jest.requireActual('@nestjs/common').ValidationPipe,
}));

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      setGlobalPrefix: jest.fn(),
      useGlobalPipes: jest.fn(),
      listen: jest.fn(),
      getUrl: jest.fn().mockResolvedValue('http://localhost:3000'),
    }),
  },
}));

jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: jest.fn().mockReturnValue({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addBearerAuth: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  }),
  SwaggerModule: {
    createDocument: jest.fn().mockReturnValue('document'),
    setup: jest.fn(),
  },
}));

jest.mock('./app.module', () => ({
  AppModule: jest.fn().mockReturnValue('AppModule'),
}));

jest.mock('./config/envs', () => ({
  envs: { PORT: 3000 },
}));

describe('Main', () => {
  let mockApp: {
    setGlobalPrefix: jest.Mock;
    useGlobalPipes: jest.Mock;
    listen: jest.Mock;
    getUrl: jest.Mock;
  };

  let mockLogger: { log: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {
      setGlobalPrefix: jest.fn(),
      useGlobalPipes: jest.fn(),
      listen: jest.fn(),
      getUrl: jest.fn().mockResolvedValue('http://localhost:3000'),
    };

    mockLogger = {
      log: jest.fn(),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    (Logger as unknown as jest.Mock).mockReturnValue(mockLogger);
  });

  it('should configure the app', async () => {
    await bootstrap();
  });

  it('should create the application with AppModule', async () => {
    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
  });

  it('should set the global prefix', async () => {
    await bootstrap();

    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith(APP_PREFIX);
  });

  it('should set the global validation pipe', async () => {
    await bootstrap();

    expect(mockApp.useGlobalPipes).toHaveBeenCalledWith(
      expect.objectContaining({
        validatorOptions: expect.objectContaining({
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      }),
    );
  });

  it('should call DocumentBuilder', async () => {
    await bootstrap();

    expect(DocumentBuilder).toHaveBeenCalled();
  });

  it('should set up the swagger document', async () => {
    await bootstrap();

    expect(SwaggerModule.setup).toHaveBeenCalledWith(
      APP_PREFIX,
      mockApp,
      expect.any(Function),
    );
  });

  it('should create the swagger document through the factory passed to setup', async () => {
    await bootstrap();

    const documentFactory = (SwaggerModule.setup as jest.Mock).mock.calls[0][2];
    documentFactory();

    expect(SwaggerModule.createDocument).toHaveBeenCalledWith(
      mockApp,
      expect.anything(),
    );
  });

  it('should listen on the configured port', async () => {
    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3000);
  });

  it('should log the application url once it is running', async () => {
    await bootstrap();

    expect(mockLogger.log).toHaveBeenCalledWith(
      'Application is running on: http://localhost:3000',
    );
  });
});
