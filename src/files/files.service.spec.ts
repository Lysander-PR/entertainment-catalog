/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';

import { FilesService } from './files.service';
import { Cover } from './entities/cover.entity';
import {
  IStorageService,
  STORAGE_SERVICE,
} from '@/common/interfaces/storage.interface';

describe('FilesService', () => {
  let service: FilesService;
  let repository: Repository<Cover>;
  let storageService: IStorageService;

  const mockCover: Cover = {
    id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    file: 'covers/abc123-cover.jpg',
    createdAt: new Date('2026-01-01'),
  } as Cover;

  const mockFile = {
    originalname: 'cover.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('fake-image-data'),
  } as Express.Multer.File;

  beforeEach(async () => {
    const repositoryMock = {
      save: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const storageServiceMock = {
      upload: jest.fn(),
      remove: jest.fn(),
      getFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: getRepositoryToken(Cover), useValue: repositoryMock },
        { provide: STORAGE_SERVICE, useValue: storageServiceMock },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    repository = module.get<Repository<Cover>>(getRepositoryToken(Cover));
    storageService = module.get<IStorageService>(STORAGE_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload a file and save the cover record', async () => {
    jest.spyOn(storageService, 'upload').mockResolvedValue(mockCover.file);
    jest.spyOn(repository, 'save').mockResolvedValue(mockCover);

    const result = await service.create(mockFile);

    expect(storageService.upload).toHaveBeenCalledWith(
      mockFile,
      mockFile.originalname,
    );
    expect(repository.save).toHaveBeenCalledWith({ file: mockCover.file });
    expect(result).toEqual(mockCover);
  });

  it('should return a cover by id', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockCover);

    const result = await service.findOne(mockCover.id);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: mockCover.id });
    expect(result).toEqual(mockCover);
  });

  it('should throw NotFoundException from findOne if the cover does not exist', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

    await expect(service.findOne(mockCover.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should return the file blob for an existing cover', async () => {
    const blob = new Blob([Buffer.from('image-bytes')], {
      type: 'image/jpeg',
    });

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockCover);
    jest.spyOn(storageService, 'getFile').mockResolvedValue(blob);

    const result = await service.getFile(mockCover.id);

    expect(storageService.getFile).toHaveBeenCalledWith(mockCover.file);
    expect(result).toBe(blob);
  });

  it('should upload a new file, merge and update the cover record', async () => {
    const newUrl = 'covers/new-file.jpg';
    const mergedCover = { ...mockCover, file: newUrl } as Cover;

    jest.spyOn(storageService, 'upload').mockResolvedValue(newUrl);
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockCover);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedCover);
    jest.spyOn(repository, 'update').mockResolvedValue({} as never);

    const result = await service.update(mockCover.id, mockFile);

    expect(storageService.upload).toHaveBeenCalledWith(
      mockFile,
      mockFile.originalname,
    );
    expect(repository.merge).toHaveBeenCalledWith(mockCover, {
      file: newUrl,
    });
    expect(repository.update).toHaveBeenCalledWith(
      { id: mockCover.id },
      mergedCover,
    );
    expect(result).toEqual(mergedCover);
  });

  it('should delete the cover record and remove the file from storage', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockCover);
    jest.spyOn(repository, 'delete').mockResolvedValue({} as never);
    jest.spyOn(storageService, 'remove').mockResolvedValue(undefined);

    const result = await service.remove(mockCover.id);

    expect(repository.delete).toHaveBeenCalledWith({ id: mockCover.id });
    expect(storageService.remove).toHaveBeenCalledWith(mockCover.file);
    expect(result).toEqual(mockCover);
  });
});
