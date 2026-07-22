/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Album } from './entities/album.entity';
import { Song } from '@/songs/entities/song.entity';

describe('AlbumsController', () => {
  let controller: AlbumsController;
  let service: AlbumsService;

  const mockSong = {
    id: 'a1f6a9f1-4b56-4f84-89c4-8ebf9d18a744',
    composer: 'Thomas Bangalter',
    title: 'Get Lucky',
    active: true,
    albumId: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
  } as Song;

  const mockAlbum: Album = {
    id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    album: 'Random Access Memories',
    releaseDate: new Date('2013-05-17'),
    studio: 'Columbia',
    artist: 'Daft Punk',
    active: true,
    songs: [mockSong],
  } as Album;

  const mockFile = { originalname: 'cover.jpg' } as Express.Multer.File;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      reactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlbumsController],
      providers: [{ provide: AlbumsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AlbumsController>(AlbumsController);
    service = module.get<AlbumsService>(AlbumsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new album without a cover file', async () => {
    const dto: CreateAlbumDto = {
      album: 'Random Access Memories',
      studio: 'Columbia',
      releaseDate: new Date('2013-05-17'),
      artist: 'Daft Punk',
      songs: [
        {
          composer: 'Thomas Bangalter',
          title: 'Get Lucky',
          genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
        },
      ] as CreateAlbumDto['songs'],
    };

    jest.spyOn(service, 'create').mockResolvedValue(mockAlbum);

    const result = await controller.create(dto, undefined);

    expect(service.create).toHaveBeenCalledWith(dto, undefined);
    expect(result).toEqual(mockAlbum);
  });

  it('should create a new album with a cover file', async () => {
    const dto: CreateAlbumDto = {
      album: 'Random Access Memories',
      studio: 'Columbia',
      releaseDate: new Date('2013-05-17'),
      artist: 'Daft Punk',
      songs: [
        {
          composer: 'Thomas Bangalter',
          title: 'Get Lucky',
          genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
        },
      ] as CreateAlbumDto['songs'],
    };

    jest.spyOn(service, 'create').mockResolvedValue(mockAlbum);

    const result = await controller.create(dto, mockFile);

    expect(service.create).toHaveBeenCalledWith(dto, mockFile);
    expect(result).toEqual(mockAlbum);
  });

  it('should return a paginated list of active albums', async () => {
    const paginationDto: PaginationDto = { limit: 10, page: 1 };

    jest.spyOn(service, 'find').mockResolvedValue([mockAlbum]);

    const result = await controller.find(paginationDto);

    expect(service.find).toHaveBeenCalledWith(paginationDto);
    expect(result).toEqual([mockAlbum]);
  });

  it('should return an album by id', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(mockAlbum);

    const result = await controller.findOne(mockAlbum.id);

    expect(service.findOne).toHaveBeenCalledWith(mockAlbum.id);
    expect(result).toEqual(mockAlbum);
  });

  it('should update an album', async () => {
    const dto: UpdateAlbumDto = { studio: 'New Studio' };
    const updatedAlbum = { ...mockAlbum, studio: dto.studio } as Album;

    jest.spyOn(service, 'update').mockResolvedValue(updatedAlbum);

    const result = await controller.update(mockAlbum.id, dto, undefined);

    expect(service.update).toHaveBeenCalledWith(mockAlbum.id, dto, undefined);
    expect(result).toEqual(updatedAlbum);
  });

  it('should soft delete an album', async () => {
    jest.spyOn(service, 'remove').mockResolvedValue(mockAlbum);

    const result = await controller.remove(mockAlbum.id);

    expect(service.remove).toHaveBeenCalledWith(mockAlbum.id);
    expect(result).toEqual(mockAlbum);
  });

  it('should reactivate an album', async () => {
    jest.spyOn(service, 'reactivate').mockResolvedValue(mockAlbum);

    const result = await controller.reactivate(mockAlbum.id);

    expect(service.reactivate).toHaveBeenCalledWith(mockAlbum.id);
    expect(result).toEqual(mockAlbum);
  });
});
