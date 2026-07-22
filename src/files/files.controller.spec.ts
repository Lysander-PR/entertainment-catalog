/* eslint-disable @typescript-eslint/unbound-method */
import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { Cover } from './entities/cover.entity';

describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;

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
    const serviceMock = {
      create: jest.fn(),
      remove: jest.fn(),
      getFile: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should upload a file and create a cover record', async () => {
    jest.spyOn(service, 'create').mockResolvedValue(mockCover);

    const result = await controller.uploadFile(mockFile);

    expect(service.create).toHaveBeenCalledWith(mockFile);
    expect(result).toEqual(mockCover);
  });

  it('should delete a file by id', async () => {
    jest.spyOn(service, 'remove').mockResolvedValue(mockCover);

    const result = await controller.removeFile(mockCover.id);

    expect(service.remove).toHaveBeenCalledWith(mockCover.id);
    expect(result).toEqual(mockCover);
  });

  it('should get a file by id and return a StreamableFile with the blob type', async () => {
    const blob = new Blob([Buffer.from('image-bytes')], {
      type: 'image/jpeg',
    });
    jest.spyOn(service, 'getFile').mockResolvedValue(blob);

    const result = await controller.getFile(mockCover.id);

    expect(service.getFile).toHaveBeenCalledWith(mockCover.id);
    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.options.type).toBe('image/jpeg');
  });

  it('should default the content type to application/octet-stream when the blob has no type', async () => {
    const blob = new Blob([Buffer.from('image-bytes')]);
    jest.spyOn(service, 'getFile').mockResolvedValue(blob);

    const result = await controller.getFile(mockCover.id);

    expect(result.options.type).toBe('application/octet-stream');
  });

  it('should update a file by id', async () => {
    const updatedCover = { ...mockCover, file: 'covers/new-file.jpg' } as Cover;
    jest.spyOn(service, 'update').mockResolvedValue(updatedCover);

    const result = await controller.updateFile(mockCover.id, mockFile);

    expect(service.update).toHaveBeenCalledWith(mockCover.id, mockFile);
    expect(result).toEqual(updatedCover);
  });
});
