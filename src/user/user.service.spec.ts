/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from './types/enums/roles.enum';
import { hashData } from '@/common/helpers/hash.helper';
import { CacheService } from '@/common/cache/cache.service';

jest.mock('@/common/helpers/hash.helper', () => ({
  hashData: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;
  let cacheService: { deleteByPrefix: jest.Mock };

  const cacheKey = '/api/user';

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
    const repositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      update: jest.fn(),
      exists: jest.fn(),
    };

    const cacheServiceMock = {
      deleteByPrefix: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repositoryMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      email: 'testuser@example.com',
      username: 'testuser',
      password: 'Str0ng!Pass',
    };

    it('should hash the password and create a new user', async () => {
      jest.mocked(hashData).mockReturnValue('hashed-password');
      jest.spyOn(repository, 'exists').mockResolvedValue(false);
      jest.spyOn(repository, 'create').mockReturnValue({
        ...dto,
        password: 'hashed-password',
      } as User);
      jest.spyOn(repository, 'save').mockResolvedValue(mockUser);

      const result = await service.create(dto);

      expect(repository.exists).toHaveBeenCalledWith({
        where: { id: undefined, email: dto.email.toLocaleLowerCase() },
      });
      expect(repository.exists).toHaveBeenCalledWith({
        where: { id: undefined, username: dto.username },
      });
      expect(repository.create).toHaveBeenCalledWith({
        email: dto.email,
        username: dto.username,
        password: 'hashed-password',
      });
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
      expect(result.rol).toBe(Roles.USER);
    });

    it('should throw ConflictException if the email already belongs to another user', async () => {
      jest.spyOn(repository, 'exists').mockResolvedValueOnce(true);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if the username already exists', async () => {
      jest
        .spyOn(repository, 'exists')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a user by id when the id is a valid UUID', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: mockUser.id,
        active: true,
      });
      expect(result).toEqual(mockUser);
    });

    it('should find a user by email when the id is not a UUID', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);

      await service.findOne(mockUser.email);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: mockUser.email,
        active: true,
      });
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.findOne(mockUser.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const dto: UpdateUserDto = { username: 'updateduser' };

    it('should update a user and invalidate the cache', async () => {
      const mergedUser = { ...mockUser, username: dto.username } as User;

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'exists').mockResolvedValue(false);
      jest.spyOn(repository, 'merge').mockReturnValue(mergedUser);
      jest.spyOn(repository, 'update').mockResolvedValue({} as never);

      const result = await service.update(mockUser.id, dto);

      expect(repository.merge).toHaveBeenCalledWith(mockUser, dto);
      expect(repository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        mergedUser,
      );
      expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(mergedUser);
    });

    it('should hash the new password when provided', async () => {
      const passwordDto: UpdateUserDto = { password: 'NewStr0ng!Pass' };
      const mergedUser = { ...mockUser } as User;

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'exists').mockResolvedValue(false);
      jest.spyOn(repository, 'merge').mockReturnValue(mergedUser);
      jest.spyOn(repository, 'update').mockResolvedValue({} as never);
      jest.mocked(hashData).mockReturnValue('new-hashed-password');

      await service.update(mockUser.id, passwordDto);

      expect(repository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        { ...mergedUser, password: 'new-hashed-password' },
      );
    });

    it('should throw ConflictException if the new email belongs to another user', async () => {
      const emailDto: UpdateUserDto = { email: 'other@example.com' };

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'exists').mockResolvedValueOnce(true);

      await expect(
        service.update(mockUser.id, emailDto),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.update(mockUser.id, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('softRemove', () => {
    it('should deactivate a user and invalidate the cache', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'update').mockResolvedValue({} as never);

      const result = await service.softRemove(mockUser.id);

      expect(repository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        { active: false },
      );
      expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.softRemove(mockUser.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('reactivate', () => {
    it('should reactivate a user and invalidate the cache prefix', async () => {
      const inactiveUser = { ...mockUser, active: false } as User;

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(inactiveUser);
      jest.spyOn(repository, 'update').mockResolvedValue({} as never);

      const result = await service.reactivate(mockUser.id);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockUser.id });
      expect(repository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        { active: true },
      );
      expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(inactiveUser);
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.reactivate(mockUser.id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
      expect(cacheService.deleteByPrefix).not.toHaveBeenCalled();
    });
  });
});
