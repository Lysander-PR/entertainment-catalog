/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Not, Repository } from 'typeorm';

import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { Cover } from '@/files/entities/cover.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { CommonService } from '@/common/common.service';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { buildStoragePath } from '@/common/helpers/build-storage-path.helper';
import { MOVIES_PATH } from './types/consts/movies.const';
import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';

describe('MoviesService', () => {
  let service: MoviesService;
  let repository: Repository<Movie>;
  let commonService: CommonService;
  let dataSource: DataSource;
  let cacheManager: { del: jest.Mock };
  let managerMock: {
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    getRepository: jest.Mock;
  };

  const cacheKey = `/${APP_PREFIX}/${MOVIES_PATH}`;

  const mockMovie: Movie = {
    id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    director: 'Denis Villeneuve',
    title: 'Dune',
    writer: 'Jon Spaihts',
    studio: 'Warner Bros',
    protagonist: 'Timothee Chalamet',
    releaseDate: new Date('2021-10-22'),
    active: true,
    createdAt: new Date('2026-01-01'),
  } as Movie;

  const dto: CreateMovieDto = {
    director: 'Denis Villeneuve',
    title: 'Dune',
    writer: 'Jon Spaihts',
    studio: 'Warner Bros',
    protagonist: 'Timothee Chalamet',
    releaseDate: new Date('2021-10-22'),
  };

  const updateDto: UpdateMovieDto = { protagonist: 'Zendaya' };

  beforeEach(async () => {
    const repositoryMock = {
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      update: jest.fn(),
      existsBy: jest.fn(),
    };

    const commonServiceMock = {
      handleUploadFile: jest.fn(),
      handleTransactionWithFile: jest
        .fn()
        .mockImplementation((_uploadedPath, transaction) => transaction),
    };

    managerMock = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      getRepository: jest.fn(),
    };

    const dataSourceMock = {
      transaction: jest
        .fn()
        .mockImplementation((_level, work) => work(managerMock)),
    };

    const cacheManagerMock = { del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: getRepositoryToken(Movie), useValue: repositoryMock },
        { provide: CommonService, useValue: commonServiceMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get<Repository<Movie>>(getRepositoryToken(Movie));
    commonService = module.get<CommonService>(CommonService);
    dataSource = module.get<DataSource>(DataSource);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException if a movie with the same title, director and studio already exists', async () => {
    jest.spyOn(repository, 'existsBy').mockResolvedValue(true);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(commonService.handleUploadFile).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should create a movie without a cover file', async () => {
    const storagePath = buildStoragePath(
      MOVIES_PATH,
      dto.studio,
      dto.director,
      dto.title,
    );

    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    jest.spyOn(commonService, 'handleUploadFile').mockResolvedValue(null);
    managerMock.create.mockReturnValue({ ...dto });
    managerMock.save.mockResolvedValue(mockMovie);

    const result = await service.create(dto);

    expect(repository.existsBy).toHaveBeenCalledWith({
      id: undefined,
      director: capitalize(dto.director),
      title: capitalize(dto.title),
      studio: capitalize(dto.studio),
    });
    expect(commonService.handleUploadFile).toHaveBeenCalledWith(
      storagePath,
      undefined,
    );
    expect(dataSource.transaction).toHaveBeenCalledWith(
      'SERIALIZABLE',
      expect.any(Function),
    );
    expect(managerMock.create).toHaveBeenCalledWith(Movie, dto);
    expect(managerMock.getRepository).not.toHaveBeenCalled();
    expect(cacheManager.del).toHaveBeenCalledWith(cacheKey);
    expect(managerMock.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockMovie);
  });

  it('should upload and link a cover file when provided on create', async () => {
    const file = { originalname: 'cover.jpg' } as Express.Multer.File;
    const uploadedPath = buildStoragePath(
      MOVIES_PATH,
      dto.studio,
      dto.director,
      dto.title,
    );
    const movieDraft = { ...dto } as Movie;
    const coverRepositoryMock = {
      save: jest.fn().mockResolvedValue({ id: 'cover-id' }),
    };

    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    jest
      .spyOn(commonService, 'handleUploadFile')
      .mockResolvedValue(uploadedPath);
    managerMock.create.mockReturnValue(movieDraft);
    managerMock.getRepository.mockReturnValue(coverRepositoryMock);
    managerMock.save.mockImplementation((movie) => Promise.resolve(movie));

    const result = await service.create(dto, file);

    expect(commonService.handleUploadFile).toHaveBeenCalledWith(
      uploadedPath,
      file,
    );
    expect(managerMock.getRepository).toHaveBeenCalledWith(Cover);
    expect(coverRepositoryMock.save).toHaveBeenCalledWith({
      file: uploadedPath,
    });
    expect(movieDraft.posterId).toBe('cover-id');
    expect(result).toEqual(movieDraft);
  });

  it('should return a paginated list of active movies', async () => {
    const paginationDto: PaginationDto = { limit: 5, page: 2 };

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockMovie], 11]);

    const result = await service.findAll(paginationDto);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      take: paginationDto.limit,
      skip: (paginationDto.page - 1) * paginationDto.limit,
      where: { active: true },
    });
    expect(result).toEqual(new PaginationResponseDto([mockMovie], 11, 2, 5));
  });

  it('should return a movie by id', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockMovie);

    const result = await service.findOne(mockMovie.id);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      id: mockMovie.id,
      active: true,
    });
    expect(result).toEqual(mockMovie);
  });

  it('should throw NotFoundException from findOne if the movie does not exist', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

    await expect(service.findOne(mockMovie.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update a movie and invalidate both cache entries', async () => {
    const mergedMovie = { ...mockMovie, ...updateDto } as Movie;

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockMovie);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedMovie);
    jest.spyOn(commonService, 'handleUploadFile').mockResolvedValue(null);
    managerMock.update.mockResolvedValue({} as never);

    const result = await service.update(mockMovie.id, updateDto);

    expect(repository.existsBy).not.toHaveBeenCalled();
    expect(repository.merge).toHaveBeenCalledWith(mockMovie, updateDto);
    expect(managerMock.update).toHaveBeenCalledWith(
      Movie,
      { id: mockMovie.id },
      mergedMovie,
    );
    expect(cacheManager.del).toHaveBeenCalledWith(
      `${cacheKey}/${mockMovie.id}`,
    );
    expect(cacheManager.del).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mergedMovie);
  });

  it('should check duplicates when the title, director or studio changes', async () => {
    const titleDto: UpdateMovieDto = { title: 'Dune: Part Two' };
    const mergedMovie = { ...mockMovie, ...titleDto } as Movie;

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockMovie);
    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedMovie);
    jest.spyOn(commonService, 'handleUploadFile').mockResolvedValue(null);
    managerMock.update.mockResolvedValue({} as never);

    await service.update(mockMovie.id, titleDto);

    expect(repository.existsBy).toHaveBeenCalledWith({
      id: Not(mockMovie.id),
      director: capitalize(mockMovie.director),
      title: capitalize(titleDto.title as string),
      studio: capitalize(mockMovie.studio),
    });
  });

  it('should throw ConflictException if the updated title/director/studio belongs to another movie', async () => {
    const titleDto: UpdateMovieDto = { title: 'Duplicate Title' };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockMovie);
    jest.spyOn(repository, 'existsBy').mockResolvedValue(true);

    await expect(service.update(mockMovie.id, titleDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(commonService.handleUploadFile).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should upload and link a cover file when the movie has none on update', async () => {
    const file = { originalname: 'cover.jpg' } as Express.Multer.File;
    const uploadedPath = 'movies/new-cover-path';
    const movieWithoutPoster = { ...mockMovie, posterId: undefined } as Movie;
    const mergedMovie = { ...movieWithoutPoster, ...updateDto } as Movie;
    const coverRepositoryMock = {
      save: jest.fn().mockResolvedValue({ id: 'new-poster-id' }),
    };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(movieWithoutPoster);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedMovie);
    jest
      .spyOn(commonService, 'handleUploadFile')
      .mockResolvedValue(uploadedPath);
    managerMock.getRepository.mockReturnValue(coverRepositoryMock);
    managerMock.update.mockResolvedValue({} as never);

    await service.update(mockMovie.id, updateDto, file);

    expect(managerMock.getRepository).toHaveBeenCalledWith(Cover);
    expect(coverRepositoryMock.save).toHaveBeenCalledWith({
      file: uploadedPath,
    });
    expect(mergedMovie.posterId).toBe('new-poster-id');
  });

  it('should deactivate a movie and invalidate both cache entries', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockMovie);
    jest.spyOn(repository, 'update').mockResolvedValue({} as never);

    const result = await service.remove(mockMovie.id);

    expect(repository.update).toHaveBeenCalledWith(
      { id: mockMovie.id },
      { active: false },
    );
    expect(cacheManager.del).toHaveBeenCalledWith(
      `${cacheKey}/${mockMovie.id}`,
    );
    expect(cacheManager.del).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mockMovie);
  });

  it('should reactivate a movie', async () => {
    const inactiveMovie = { ...mockMovie, active: false } as Movie;

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(inactiveMovie);
    jest.spyOn(repository, 'update').mockResolvedValue({} as never);

    const result = await service.reactivate(mockMovie.id);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockMovie.id });
    expect(repository.update).toHaveBeenCalledWith(
      { id: mockMovie.id },
      { active: true },
    );
    expect(result).toEqual(inactiveMovie);
  });

  it('should throw NotFoundException from reactivate if the movie does not exist', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

    await expect(service.reactivate(mockMovie.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});
