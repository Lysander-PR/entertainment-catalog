/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Roles } from './types/enums/roles.enum';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser: User = {
    id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'hashed-password',
    verified: false,
    rol: Roles.USER,
    active: true,
  } as User;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softRemove: jest.fn(),
      reactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: serviceMock }],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new user', async () => {
    const dto: CreateUserDto = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'Str0ng!Pass',
    };

    jest.spyOn(service, 'create').mockResolvedValue(mockUser);
    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  it('should return a user by id', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
    const result = await controller.findOne(mockUser.id);

    expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
    expect(result).toEqual(mockUser);
  });

  it('should update a user', async () => {
    const dto: UpdateUserDto = { username: 'updateduser' };
    const updatedUser = { ...mockUser, username: 'updateduser' } as User;

    jest.spyOn(service, 'update').mockResolvedValue(updatedUser);

    const result = await controller.update(mockUser.id, dto);

    expect(service.update).toHaveBeenCalledWith(mockUser.id, dto);
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(result).toEqual(updatedUser);
  });

  it('should soft delete a user', async () => {
    jest.spyOn(service, 'softRemove').mockResolvedValue(mockUser);
    const result = await controller.remove(mockUser.id);

    expect(service.softRemove).toHaveBeenCalledWith(mockUser.id);
    expect(service.softRemove).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  it('should reactivate a user', async () => {
    jest.spyOn(service, 'reactivate').mockResolvedValue(mockUser);
    const result = await controller.reactivate(mockUser.id);

    expect(service.reactivate).toHaveBeenCalledWith(mockUser.id);
    expect(service.reactivate).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });
});
