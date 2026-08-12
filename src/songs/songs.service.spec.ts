/* eslint-disable @typescript-eslint/unbound-method */
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Not, Repository, UpdateResult } from 'typeorm';

import { SongsService } from './songs.service';
import { Song } from './entities/song.entity';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { SONGS_PATH } from './types/consts/songs.const';
import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';
import { CacheService } from '@/common/cache/cache.service';

describe('SongsService', () => {
  let service: SongsService;
  let repository: Repository<Song>;
  let cacheService: { deleteByPrefix: jest.Mock };

  const cacheKey = `/${APP_PREFIX}/${SONGS_PATH}`;

  const mockSong: Song = {
    id: 'a1f6a9f1-4b56-4f84-89c4-8ebf9d18a744',
    composer: 'Thomas Bangalter',
    title: 'Get Lucky',
    active: true,
    albumId: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
  } as Song;

  const dto: CreateSongDto = {
    composer: 'Thomas Bangalter',
    title: 'Get Lucky',
    albumId: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
  };

  beforeEach(async () => {
    const repositoryMock = {
      save: jest.fn(),
      create: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      findBy: jest.fn(),
      merge: jest.fn(),
      update: jest.fn(),
    };

    const cacheServiceMock = { deleteByPrefix: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        { provide: getRepositoryToken(Song), useValue: repositoryMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<SongsService>(SongsService);
    repository = module.get<Repository<Song>>(getRepositoryToken(Song));
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException if a song with the same title already exists in the album', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockSong);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should create a song and invalidate the cache', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);
    jest.spyOn(repository, 'create').mockReturnValue(mockSong);
    jest.spyOn(repository, 'save').mockResolvedValue(mockSong);

    const result = await service.create(dto);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      id: undefined,
      albumId: dto.albumId,
      title: capitalize(dto.title),
    });
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(mockSong);
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mockSong);
  });

  it('should return a paginated list of active songs with relations', async () => {
    const paginationDto: PaginationDto = { limit: 5, page: 2 };

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockSong], 11]);

    const result = await service.findAll(paginationDto);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      take: paginationDto.limit,
      skip: (paginationDto.page - 1) * paginationDto.limit,
      where: { active: true },
      relations: { album: true, genre: true },
    });
    expect(result).toEqual(new PaginationResponseDto([mockSong], 11, 2, 5));
  });

  it('should return a song by id with relations', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockSong);

    const result = await service.findOne(mockSong.id);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: mockSong.id, active: true },
      relations: { album: true, genre: true },
    });
    expect(result).toEqual(mockSong);
  });

  it('should throw NotFoundException from findOne if the song does not exist', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    await expect(service.findOne(mockSong.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update a song and invalidate both cache entries', async () => {
    const updateDto: UpdateSongDto = { guestArtist: 'Pharrell Williams' };
    const mergedSong = { ...mockSong, ...updateDto } as Song;

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockSong);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedSong);
    jest
      .spyOn(repository, 'update')
      .mockResolvedValue({ affected: 1 } as UpdateResult);

    const result = await service.update(mockSong.id, updateDto);

    expect(repository.findOneBy).not.toHaveBeenCalled();
    expect(repository.merge).toHaveBeenCalledWith(mockSong, updateDto);
    expect(repository.update).toHaveBeenCalledWith(
      { id: mockSong.id },
      mergedSong,
    );
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mergedSong);
  });

  it('should check duplicates when the title or albumId changes', async () => {
    const titleDto: UpdateSongDto = { title: 'Get Lucky (Remix)' };
    const mergedSong = { ...mockSong, ...titleDto } as Song;

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockSong);
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedSong);
    jest
      .spyOn(repository, 'update')
      .mockResolvedValue({ affected: 1 } as UpdateResult);

    await service.update(mockSong.id, titleDto);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      id: Not(mockSong.id),
      albumId: mockSong.albumId,
      title: capitalize(titleDto.title as string),
    });
  });

  it('should throw ConflictException if the updated title already exists in the album', async () => {
    const titleDto: UpdateSongDto = { title: 'Duplicate Title' };

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockSong);
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockSong);

    await expect(service.update(mockSong.id, titleDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException if no rows were affected while updating', async () => {
    const updateDto: UpdateSongDto = { guestArtist: 'Pharrell Williams' };
    const mergedSong = { ...mockSong, ...updateDto } as Song;

    jest.spyOn(repository, 'findOne').mockResolvedValue(mockSong);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedSong);
    jest
      .spyOn(repository, 'update')
      .mockResolvedValue({ affected: 0 } as UpdateResult);

    await expect(service.update(mockSong.id, updateDto)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('should deactivate a song and invalidate both cache entries', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(mockSong);
    jest.spyOn(repository, 'update').mockResolvedValue({} as never);

    const result = await service.remove(mockSong.id);

    expect(repository.update).toHaveBeenCalledWith(
      { id: mockSong.id },
      { active: false },
    );
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mockSong);
  });

  it('should reactivate a song and invalidate the cache prefix', async () => {
    const inactiveSong = { ...mockSong, active: false } as Song;

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(inactiveSong);
    jest.spyOn(repository, 'update').mockResolvedValue({} as never);

    const result = await service.reactivate(mockSong.id);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockSong.id });
    expect(repository.update).toHaveBeenCalledWith(
      { id: mockSong.id },
      { active: true },
    );
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(inactiveSong);
  });

  it('should throw NotFoundException from reactivate if the song does not exist', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

    await expect(service.reactivate(mockSong.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.update).not.toHaveBeenCalled();
    expect(cacheService.deleteByPrefix).not.toHaveBeenCalled();
  });

  it('should reactivate every inactive song of the album and return the album songs', async () => {
    const inactiveSong = { ...mockSong, active: false } as Song;

    jest
      .spyOn(repository, 'findBy')
      .mockResolvedValueOnce([inactiveSong])
      .mockResolvedValueOnce([mockSong]);
    jest
      .spyOn(repository, 'update')
      .mockResolvedValue({ affected: 1 } as UpdateResult);

    const result = await service.reactivateByAlbumId(mockSong.albumId);

    expect(repository.findBy).toHaveBeenNthCalledWith(1, {
      albumId: mockSong.albumId,
      active: false,
    });
    expect(repository.update).toHaveBeenCalledWith(
      { albumId: mockSong.albumId, active: false },
      { active: true },
    );
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(repository.findBy).toHaveBeenNthCalledWith(2, {
      albumId: mockSong.albumId,
    });
    expect(result).toEqual([mockSong]);
  });

  it('should return an empty array without updating when the album has no inactive songs', async () => {
    jest.spyOn(repository, 'findBy').mockResolvedValue([]);

    const result = await service.reactivateByAlbumId(mockSong.albumId);

    expect(result).toEqual([]);
    expect(repository.update).not.toHaveBeenCalled();
    expect(cacheService.deleteByPrefix).not.toHaveBeenCalled();
  });
});
