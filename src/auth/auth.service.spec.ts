/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '@/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { isMatchEncrypted } from '@/common/helpers/hash.helper';

jest.mock('@/common/helpers/hash.helper', () => ({
  isMatchEncrypted: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;

  const mockUser = {
    id: '1',
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'hashed-password',
  } as User;

  beforeEach(async () => {
    const userServiceMock = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const jwtServiceMock = {
      sign: jest.fn().mockReturnValue('test-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user and return user with token', async () => {
    const registerDto: CreateUserDto = {
      username: mockUser.username,
      email: mockUser.email,
      password: 'password123',
    };

    jest.spyOn(userService, 'create').mockResolvedValue(mockUser);
    const result = await service.register(registerDto);

    expect(userService.create).toHaveBeenCalledTimes(1);
    expect(userService.create).toHaveBeenCalledWith(registerDto);
    expect(result.access_token).toBeDefined();
    expect(typeof result.access_token).toBe('string');
    expect(result.user).toEqual(mockUser);
    expect(result.user.password).not.toBe(registerDto.password);
  });

  it('should throw an error if user already exists', async () => {
    const registerDto: CreateUserDto = {
      username: mockUser.username,
      email: mockUser.email,
      password: 'password123',
    };

    jest
      .spyOn(userService, 'create')
      .mockRejectedValue(new Error('User already exists'));
    await expect(service.register(registerDto)).rejects.toThrow(
      'User already exists',
    );
  });

  it('should login an existing user and return a token', async () => {
    const loginDto = {
      email: mockUser.email,
      password: 'password123',
    };

    jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);
    jest.mocked(isMatchEncrypted).mockReturnValue(true);

    const result = await service.login(loginDto);

    expect(userService.findOne).toHaveBeenCalledTimes(1);
    expect(userService.findOne).toHaveBeenCalledWith(loginDto.email);
    expect(isMatchEncrypted).toHaveBeenCalledWith(
      loginDto.password,
      mockUser.password,
    );
    expect(result.access_token).toBeDefined();
    expect(typeof result.access_token).toBe('string');
    expect(result.user).toEqual(mockUser);
  });

  it('should throw BadRequestException if credentials are invalid', async () => {
    const loginDto = {
      email: mockUser.email,
      password: 'wrong-password',
    };

    jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);
    jest.mocked(isMatchEncrypted).mockReturnValue(false);

    try {
      await service.login(loginDto);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      const error = err as BadRequestException;
      expect(error.message).toBe('Credentials are not valid');
    }
  });
});
