/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Song } from './entities/song.entity';

describe('SongsController', () => {
  let controller: SongsController;
  let service: SongsService;

  const mockSong = {
    id: 'a1f6a9f1-4b56-4f84-89c4-8ebf9d18a744',
    composer: 'Thomas Bangalter',
    title: 'Get Lucky',
    active: true,
    albumId: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
  } as Song;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      reactivate: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsController],
      providers: [{ provide: SongsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SongsController>(SongsController);
    service = module.get<SongsService>(SongsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new song', async () => {
    const dto: CreateSongDto = {
      composer: 'Thomas Bangalter',
      title: 'Get Lucky',
      albumId: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
    };

    jest.spyOn(service, 'create').mockResolvedValue(mockSong);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockSong);
  });

  it('should reactivate a song', async () => {
    jest.spyOn(service, 'reactivate').mockResolvedValue(mockSong);

    const result = await controller.reactivate(mockSong.id);

    expect(service.reactivate).toHaveBeenCalledWith(mockSong.id);
    expect(result).toEqual(mockSong);
  });

  it('should return a paginated list of active songs', async () => {
    const paginationDto: PaginationDto = { limit: 10, page: 1 };

    jest.spyOn(service, 'findAll').mockResolvedValue([mockSong]);

    const result = await controller.findAll(paginationDto);

    expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    expect(result).toEqual([mockSong]);
  });

  it('should return a song by id', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(mockSong);

    const result = await controller.findOne(mockSong.id);

    expect(service.findOne).toHaveBeenCalledWith(mockSong.id);
    expect(result).toEqual(mockSong);
  });

  it('should update a song', async () => {
    const dto: UpdateSongDto = { title: 'Get Lucky (Remix)' };
    const updatedSong = { ...mockSong, title: dto.title } as Song;

    jest.spyOn(service, 'update').mockResolvedValue(updatedSong);

    const result = await controller.update(mockSong.id, dto);

    expect(service.update).toHaveBeenCalledWith(mockSong.id, dto);
    expect(result).toEqual(updatedSong);
  });

  it('should soft delete a song', async () => {
    jest.spyOn(service, 'remove').mockResolvedValue(mockSong);

    const result = await controller.remove(mockSong.id);

    expect(service.remove).toHaveBeenCalledWith(mockSong.id);
    expect(result).toEqual(mockSong);
  });
});
