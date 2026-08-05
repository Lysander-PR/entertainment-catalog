/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { Movie } from './entities/movie.entity';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

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

  const mockFile = { originalname: 'cover.jpg' } as Express.Multer.File;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      reactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [{ provide: MoviesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new movie without a cover file', async () => {
    const dto: CreateMovieDto = {
      director: 'Denis Villeneuve',
      title: 'Dune',
      writer: 'Jon Spaihts',
      studio: 'Warner Bros',
      protagonist: 'Timothee Chalamet',
      releaseDate: new Date('2021-10-22'),
    };

    jest.spyOn(service, 'create').mockResolvedValue(mockMovie);

    const result = await controller.create(dto, undefined);

    expect(service.create).toHaveBeenCalledWith(dto, undefined);
    expect(result).toEqual(mockMovie);
  });

  it('should create a new movie with a cover file', async () => {
    const dto: CreateMovieDto = {
      director: 'Denis Villeneuve',
      title: 'Dune',
      writer: 'Jon Spaihts',
      studio: 'Warner Bros',
      protagonist: 'Timothee Chalamet',
      releaseDate: new Date('2021-10-22'),
    };

    jest.spyOn(service, 'create').mockResolvedValue(mockMovie);

    const result = await controller.create(dto, mockFile);

    expect(service.create).toHaveBeenCalledWith(dto, mockFile);
    expect(result).toEqual(mockMovie);
  });

  it('should return a paginated list of active movies', async () => {
    const paginationDto: PaginationDto = { limit: 10, page: 1 };

    const paginated = new PaginationResponseDto([mockMovie], 1, 1, 10);

    jest.spyOn(service, 'findAll').mockResolvedValue(paginated);

    const result = await controller.findAll(paginationDto);

    expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    expect(result).toEqual(paginated);
  });

  it('should return a movie by id', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(mockMovie);

    const result = await controller.findOne(mockMovie.id);

    expect(service.findOne).toHaveBeenCalledWith(mockMovie.id);
    expect(result).toEqual(mockMovie);
  });

  it('should update a movie', async () => {
    const dto: UpdateMovieDto = { title: 'Dune: Part Two' };
    const updatedMovie = { ...mockMovie, title: dto.title } as Movie;

    jest.spyOn(service, 'update').mockResolvedValue(updatedMovie);

    const result = await controller.update(mockMovie.id, dto, undefined);

    expect(service.update).toHaveBeenCalledWith(mockMovie.id, dto, undefined);
    expect(result).toEqual(updatedMovie);
  });

  it('should soft delete a movie', async () => {
    jest.spyOn(service, 'remove').mockResolvedValue(mockMovie);

    const result = await controller.remove(mockMovie.id);

    expect(service.remove).toHaveBeenCalledWith(mockMovie.id);
    expect(result).toEqual(mockMovie);
  });

  it('should reactivate a movie', async () => {
    jest.spyOn(service, 'reactivate').mockResolvedValue(mockMovie);

    const result = await controller.reactivate(mockMovie.id);

    expect(service.reactivate).toHaveBeenCalledWith(mockMovie.id);
    expect(result).toEqual(mockMovie);
  });
});
