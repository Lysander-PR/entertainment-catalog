/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { LoginDto } from './dto/login-auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '@/user/entities/user.entity';
import { Roles } from '@/user/types/enums/roles.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser: User = {
    id: '1',
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'hashed-password',
    verified: false,
    rol: Roles.USER,
    active: true,
  } as User;

  const mockAuthResponse: AuthResponseDto = {
    user: mockUser,
    access_token: 'test-token',
  };

  beforeEach(async () => {
    const serviceMock = {
      login: jest.fn(),
      register: jest.fn(),
      refreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a new user and return it with a token', async () => {
    const dto: CreateUserDto = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
    };

    jest.spyOn(service, 'register').mockResolvedValue(mockAuthResponse);
    const result = await controller.register(dto);

    expect(service.register).toHaveBeenCalledWith(dto);
    expect(service.register).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockAuthResponse);
  });

  it('should login an existing user and return a token', async () => {
    const dto: LoginDto = {
      email: 'testuser@example.com',
      password: 'password123',
    };

    jest.spyOn(service, 'login').mockResolvedValue(mockAuthResponse);
    const result = await controller.login(dto);

    expect(service.login).toHaveBeenCalledWith(dto);
    expect(service.login).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockAuthResponse);
  });

  it('should propagate the error when login credentials are invalid', async () => {
    const dto: LoginDto = {
      email: 'testuser@example.com',
      password: 'wrong-password',
    };

    jest
      .spyOn(service, 'login')
      .mockRejectedValue(new BadRequestException('Credentials are not valid'));

    await expect(controller.login(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should renew the token for the authenticated user', () => {
    jest.spyOn(service, 'refreshToken').mockReturnValue(mockAuthResponse);
    const result = controller.refresh(mockUser);

    expect(service.refreshToken).toHaveBeenCalledWith(mockUser);
    expect(service.refreshToken).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockAuthResponse);
  });
});
