/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Genre } from './entities/genre.entity';

describe('GenresController', () => {
  let controller: GenresController;
  let service: GenresService;

  const mockGenre: Genre = {
    id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    genre: 'Rock',
  } as Genre;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenresController],
      providers: [{ provide: GenresService, useValue: serviceMock }],
    }).compile();

    controller = module.get<GenresController>(GenresController);
    service = module.get<GenresService>(GenresService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new genre', async () => {
    const dto: CreateGenreDto = { description: 'Rock' };

    jest.spyOn(service, 'create').mockResolvedValue(mockGenre);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockGenre);
  });

  it('should return a paginated list of genres', async () => {
    const paginationDto: PaginationDto = { limit: 10, page: 1 };

    jest.spyOn(service, 'find').mockResolvedValue([mockGenre]);

    const result = await controller.find(paginationDto);

    expect(service.find).toHaveBeenCalledWith(paginationDto);
    expect(result).toEqual([mockGenre]);
  });

  it('should return a genre by id', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(mockGenre);

    const result = await controller.findOne(mockGenre.id);

    expect(service.findOne).toHaveBeenCalledWith(mockGenre.id);
    expect(result).toEqual(mockGenre);
  });

  it('should update a genre', async () => {
    const dto: UpdateGenreDto = { description: 'Jazz' };
    const updatedGenre = { ...mockGenre, genre: 'Jazz' } as Genre;

    jest.spyOn(service, 'update').mockResolvedValue(updatedGenre);

    const result = await controller.update(mockGenre.id, dto);

    expect(service.update).toHaveBeenCalledWith(mockGenre.id, dto);
    expect(result).toEqual(updatedGenre);
  });

  it('should delete a genre', async () => {
    jest.spyOn(service, 'remove').mockResolvedValue(mockGenre);

    const result = await controller.remove(mockGenre.id);

    expect(service.remove).toHaveBeenCalledWith(mockGenre.id);
    expect(result).toEqual(mockGenre);
  });
});
