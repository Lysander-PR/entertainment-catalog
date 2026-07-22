/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Not, Repository, UpdateResult } from 'typeorm';

import { AlbumsService } from './albums.service';
import { Album } from './entities/album.entity';
import { Song } from '@/songs/entities/song.entity';
import { Cover } from '@/files/entities/cover.entity';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CommonService } from '@/common/common.service';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { buildStoragePath } from '@/common/helpers/build-storage-path.helper';
import { ALBUMS_PATH } from './types/consts/albums.const';
import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';

describe('AlbumsService', () => {
  let service: AlbumsService;
  let repository: Repository<Album>;
  let commonService: CommonService;
  let dataSource: DataSource;
  let cacheManager: { del: jest.Mock };
  let managerMock: {
    create: jest.Mock;
    save: jest.Mock;
    getRepository: jest.Mock;
  };

  const cacheKey = `/${APP_PREFIX}/${ALBUMS_PATH}`;

  const songsInput: CreateAlbumDto['songs'] = [
    {
      composer: 'Thomas Bangalter',
      title: 'Get Lucky',
      genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
    },
  ] as CreateAlbumDto['songs'];

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

  const dto: CreateAlbumDto = {
    album: 'Random Access Memories',
    studio: 'Columbia',
    releaseDate: new Date('2013-05-17'),
    artist: 'Daft Punk',
    songs: songsInput,
  };

  const updateDto: UpdateAlbumDto = { studio: 'New Studio' };

  beforeEach(async () => {
    const repositoryMock = {
      find: jest.fn(),
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
      getRepository: jest.fn(),
    };

    const dataSourceMock = {
      transaction: jest
        .fn()
        .mockImplementation((_level, work) => work(managerMock)),
      getRepository: jest.fn(),
    };

    const cacheManagerMock = { del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumsService,
        { provide: getRepositoryToken(Album), useValue: repositoryMock },
        { provide: CommonService, useValue: commonServiceMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
      ],
    }).compile();

    service = module.get<AlbumsService>(AlbumsService);
    repository = module.get<Repository<Album>>(getRepositoryToken(Album));
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

  it('should throw ConflictException if an album with the same name and artist already exists', async () => {
    jest.spyOn(repository, 'existsBy').mockResolvedValue(true);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(commonService.handleUploadFile).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should create an album with its songs and invalidate the cache', async () => {
    const storagePath = buildStoragePath(ALBUMS_PATH, dto.artist, dto.album);
    const songsDraft = [{ ...songsInput[0] }];
    const albumDraft = { ...dto, songs: songsDraft } as Album;
    const albumSaved = { ...mockAlbum, songs: [] } as unknown as Album;
    const savedSongs = [mockSong];
    const songRepositoryMock = {
      save: jest.fn().mockResolvedValue(savedSongs),
    };

    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    jest.spyOn(commonService, 'handleUploadFile').mockResolvedValue(null);
    managerMock.create
      .mockImplementationOnce(() => songsDraft)
      .mockImplementationOnce(() => albumDraft);
    managerMock.getRepository.mockReturnValue(songRepositoryMock);
    managerMock.save.mockResolvedValue(albumSaved);

    const result = await service.create(dto);

    expect(repository.existsBy).toHaveBeenCalledWith({
      id: undefined,
      album: capitalize(dto.album),
      artist: capitalize(dto.artist),
    });
    expect(commonService.handleUploadFile).toHaveBeenCalledWith(
      storagePath,
      undefined,
    );
    expect(managerMock.create).toHaveBeenCalledWith(Song, dto.songs);
    expect(managerMock.create).toHaveBeenCalledWith(Album, {
      ...dto,
      songs: songsDraft,
    });
    expect(managerMock.getRepository).not.toHaveBeenCalledWith(Cover);
    expect(managerMock.save).toHaveBeenCalledWith(albumDraft);
    expect(songRepositoryMock.save).toHaveBeenCalledWith(songsDraft);
    expect(cacheManager.del).toHaveBeenCalledWith(cacheKey);
    expect(result).toBe(albumSaved);
    expect(result.songs).toEqual(savedSongs);
  });

  it('should upload and link a cover file when provided on create', async () => {
    const file = { originalname: 'cover.jpg' } as Express.Multer.File;
    const uploadedPath = buildStoragePath(ALBUMS_PATH, dto.artist, dto.album);
    const songsDraft = [{ ...songsInput[0] }];
    const albumDraft = { ...dto, songs: songsDraft } as Album;
    const coverRepositoryMock = {
      save: jest.fn().mockResolvedValue({ id: 'cover-id' }),
    };
    const songRepositoryMock = { save: jest.fn().mockResolvedValue([]) };

    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    jest
      .spyOn(commonService, 'handleUploadFile')
      .mockResolvedValue(uploadedPath);
    managerMock.create
      .mockImplementationOnce(() => songsDraft)
      .mockImplementationOnce(() => albumDraft);
    managerMock.getRepository
      .mockImplementationOnce(() => coverRepositoryMock)
      .mockImplementationOnce(() => songRepositoryMock);
    managerMock.save.mockImplementation((album) => Promise.resolve(album));

    await service.create(dto, file);

    expect(commonService.handleUploadFile).toHaveBeenCalledWith(
      uploadedPath,
      file,
    );
    expect(managerMock.getRepository).toHaveBeenCalledWith(Cover);
    expect(coverRepositoryMock.save).toHaveBeenCalledWith({
      file: uploadedPath,
    });
    expect(albumDraft.coverId).toBe('cover-id');
  });

  it('should return a paginated list of active albums', async () => {
    const paginationDto: PaginationDto = { limit: 5, page: 2 };

    jest.spyOn(repository, 'find').mockResolvedValue([mockAlbum]);

    const result = await service.find(paginationDto);

    expect(repository.find).toHaveBeenCalledWith({
      take: paginationDto.limit,
      skip: (paginationDto.page - 1) * paginationDto.limit,
      where: { active: true },
    });
    expect(result).toEqual([mockAlbum]);
  });

  it('should return an album by id', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockAlbum);

    const result = await service.findOne(mockAlbum.id);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      id: mockAlbum.id,
      active: true,
    });
    expect(result).toEqual(mockAlbum);
  });

  it('should throw NotFoundException from findOne if the album does not exist', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

    await expect(service.findOne(mockAlbum.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update an album and invalidate both cache entries', async () => {
    const mergedAlbum = { ...mockAlbum, ...updateDto } as Album;

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockAlbum);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedAlbum);
    jest.spyOn(commonService, 'handleUploadFile').mockResolvedValue(null);
    managerMock.save.mockResolvedValue(mergedAlbum);

    const result = await service.update(mockAlbum.id, updateDto);

    expect(repository.existsBy).not.toHaveBeenCalled();
    expect(repository.merge).toHaveBeenCalledWith(mockAlbum, {
      ...updateDto,
      songs: mockAlbum.songs,
    });
    expect(cacheManager.del).toHaveBeenCalledWith(
      `${cacheKey}/${mockAlbum.id}`,
    );
    expect(cacheManager.del).toHaveBeenCalledWith(cacheKey);
    expect(managerMock.save).toHaveBeenCalledWith(mergedAlbum);
    expect(result).toEqual(mergedAlbum);
  });

  it('should check duplicates when the album title or artist changes', async () => {
    const albumDto: UpdateAlbumDto = { album: 'Random Access Memories 2' };
    const mergedAlbum = { ...mockAlbum, ...albumDto } as Album;

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockAlbum);
    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedAlbum);
    jest.spyOn(commonService, 'handleUploadFile').mockResolvedValue(null);
    managerMock.save.mockResolvedValue(mergedAlbum);

    await service.update(mockAlbum.id, albumDto);

    expect(repository.existsBy).toHaveBeenCalledWith({
      id: Not(mockAlbum.id),
      album: capitalize(albumDto.album as string),
      artist: capitalize(mockAlbum.artist),
    });
  });

  it('should throw ConflictException if the updated album/artist belongs to another album', async () => {
    const albumDto: UpdateAlbumDto = { album: 'Duplicate Album' };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockAlbum);
    jest.spyOn(repository, 'existsBy').mockResolvedValue(true);

    await expect(service.update(mockAlbum.id, albumDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(commonService.handleUploadFile).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should upload and link a cover file when the album has none on update', async () => {
    const file = { originalname: 'cover.jpg' } as Express.Multer.File;
    const uploadedPath = 'albums/new-cover-path';
    const albumWithoutCover = { ...mockAlbum, coverId: undefined } as Album;
    const mergedAlbum = { ...albumWithoutCover, ...updateDto } as Album;
    const coverRepositoryMock = {
      save: jest.fn().mockResolvedValue({ id: 'new-cover-id' }),
    };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(albumWithoutCover);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedAlbum);
    jest
      .spyOn(commonService, 'handleUploadFile')
      .mockResolvedValue(uploadedPath);
    managerMock.getRepository.mockReturnValue(coverRepositoryMock);
    managerMock.save.mockImplementation((album) => Promise.resolve(album));

    await service.update(mockAlbum.id, updateDto, file);

    expect(managerMock.getRepository).toHaveBeenCalledWith(Cover);
    expect(coverRepositoryMock.save).toHaveBeenCalledWith({
      file: uploadedPath,
    });
    expect(mergedAlbum.coverId).toBe('new-cover-id');
  });

  it('should deactivate an album and its songs, invalidating both cache entries', async () => {
    const songRepositoryMock = {
      update: jest.fn().mockResolvedValue({ affected: 1 } as UpdateResult),
    };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockAlbum);
    jest
      .spyOn(repository, 'update')
      .mockResolvedValue({ affected: 1 } as UpdateResult);
    jest
      .spyOn(dataSource, 'getRepository')
      .mockReturnValue(songRepositoryMock as never);

    const result = await service.remove(mockAlbum.id);

    expect(repository.update).toHaveBeenCalledWith(
      { id: mockAlbum.id },
      { active: false },
    );
    expect(dataSource.getRepository).toHaveBeenCalledWith(Song);
    expect(songRepositoryMock.update).toHaveBeenCalledWith(
      { albumId: mockAlbum.id },
      { active: false },
    );
    expect(cacheManager.del).toHaveBeenCalledWith(
      `${cacheKey}/${mockAlbum.id}`,
    );
    expect(cacheManager.del).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mockAlbum);
  });

  it('should throw InternalServerErrorException if no rows were affected while removing', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockAlbum);
    jest
      .spyOn(repository, 'update')
      .mockResolvedValue({ affected: 0 } as UpdateResult);

    await expect(service.remove(mockAlbum.id)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(dataSource.getRepository).not.toHaveBeenCalled();
  });

  it('should reactivate an album and its songs', async () => {
    const inactiveAlbum = { ...mockAlbum, active: false } as Album;
    const songRepositoryMock = {
      update: jest.fn().mockResolvedValue({ affected: 1 } as UpdateResult),
    };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(inactiveAlbum);
    jest.spyOn(repository, 'update').mockResolvedValue({} as never);
    jest
      .spyOn(dataSource, 'getRepository')
      .mockReturnValue(songRepositoryMock as never);

    const result = await service.reactivate(mockAlbum.id);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockAlbum.id });
    expect(repository.update).toHaveBeenCalledWith(
      { id: mockAlbum.id },
      { active: true },
    );
    expect(dataSource.getRepository).toHaveBeenCalledWith(Song);
    expect(songRepositoryMock.update).toHaveBeenCalledWith(
      { albumId: mockAlbum.id },
      { active: true },
    );
    expect(result).toEqual(inactiveAlbum);
  });

  it('should throw NotFoundException from reactivate if the album does not exist', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

    await expect(service.reactivate(mockAlbum.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});
