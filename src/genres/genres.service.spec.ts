/* eslint-disable @typescript-eslint/unbound-method */
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository, UpdateResult } from 'typeorm';

import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { GENRES_PATH } from './types/consts/genres.const';
import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';
import { CacheService } from '@/common/cache/cache.service';

describe('GenresService', () => {
  let service: GenresService;
  let repository: Repository<Genre>;
  let cacheService: { deleteByPrefix: jest.Mock };

  const cacheKey = `/${APP_PREFIX}/${GENRES_PATH}`;

  const mockGenre: Genre = {
    id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    genre: 'Rock',
  } as Genre;

  beforeEach(async () => {
    const repositoryMock = {
      save: jest.fn(),
      findAndCount: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const cacheServiceMock = { deleteByPrefix: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenresService,
        { provide: getRepositoryToken(Genre), useValue: repositoryMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<GenresService>(GenresService);
    repository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a genre with a capitalized description and invalidate the cache prefix', async () => {
    const dto: CreateGenreDto = { description: 'rock' };

    jest.spyOn(repository, 'save').mockResolvedValue(mockGenre);

    const result = await service.create(dto);

    expect(repository.save).toHaveBeenCalledWith({
      genre: capitalize(dto.description),
    });
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mockGenre);
  });

  it('should return a paginated list of genres', async () => {
    const paginationDto: PaginationDto = { limit: 5, page: 2 };

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockGenre], 11]);

    const result = await service.find(paginationDto);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      take: paginationDto.limit,
      skip: (paginationDto.page - 1) * paginationDto.limit,
    });
    expect(result).toEqual(new PaginationResponseDto([mockGenre], 11, 2, 5));
  });

  it('should return every genre without pagination', async () => {
    jest.spyOn(repository, 'find').mockResolvedValue([mockGenre]);

    const result = await service.findAll();

    expect(repository.find).toHaveBeenCalledWith();
    expect(result).toEqual([mockGenre]);
  });

  it('should return a genre by id', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockGenre);

    const result = await service.findOne(mockGenre.id);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockGenre.id });
    expect(result).toEqual(mockGenre);
  });

  it('should throw NotFoundException from findOne if the genre does not exist', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

    await expect(service.findOne(mockGenre.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update a genre and invalidate the whole cache prefix', async () => {
    const dto: UpdateGenreDto = { description: 'jazz' };
    const mergedGenre = {
      ...mockGenre,
      genre: capitalize(dto.description as string),
    } as Genre;

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockGenre);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedGenre);
    jest
      .spyOn(repository, 'update')
      .mockResolvedValue({ affected: 1 } as UpdateResult);

    const result = await service.update(mockGenre.id, dto);

    expect(repository.merge).toHaveBeenCalledWith(mockGenre, {
      genre: capitalize(dto.description as string),
    });
    expect(repository.update).toHaveBeenCalledWith(
      { id: mockGenre.id },
      mergedGenre,
    );
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(cacheService.deleteByPrefix).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mergedGenre);
  });

  it('should merge with an undefined genre value when no description is provided', async () => {
    const dto: UpdateGenreDto = {};

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockGenre);
    jest.spyOn(repository, 'merge').mockReturnValue(mockGenre);
    jest
      .spyOn(repository, 'update')
      .mockResolvedValue({ affected: 1 } as UpdateResult);

    await service.update(mockGenre.id, dto);

    expect(repository.merge).toHaveBeenCalledWith(mockGenre, {
      genre: undefined,
    });
  });

  it('should throw InternalServerErrorException if no rows were affected while updating', async () => {
    const dto: UpdateGenreDto = { description: 'jazz' };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockGenre);
    jest.spyOn(repository, 'merge').mockReturnValue(mockGenre);
    jest
      .spyOn(repository, 'update')
      .mockResolvedValue({ affected: 0 } as UpdateResult);

    await expect(service.update(mockGenre.id, dto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('should delete a genre and invalidate the whole cache prefix', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockGenre);
    jest
      .spyOn(repository, 'delete')
      .mockResolvedValue({ affected: 1 } as never);

    const result = await service.remove(mockGenre.id);

    expect(repository.delete).toHaveBeenCalledWith({ id: mockGenre.id });
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(cacheService.deleteByPrefix).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockGenre);
  });

  it('should throw InternalServerErrorException if no rows were affected while removing', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockGenre);
    jest
      .spyOn(repository, 'delete')
      .mockResolvedValue({ affected: 0 } as never);

    await expect(service.remove(mockGenre.id)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
