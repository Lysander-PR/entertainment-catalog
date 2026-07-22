import { Test, TestingModule } from '@nestjs/testing';

import { CommonService } from './common.service';
import { STORAGE_SERVICE } from './interfaces/storage.interface';

describe('CommonService', () => {
  let service: CommonService;
  let storageService: { upload: jest.Mock; remove: jest.Mock };

  const mockFile = {
    originalname: 'cover.jpg',
    buffer: Buffer.from('fake-image-data'),
  } as Express.Multer.File;

  beforeEach(async () => {
    const storageServiceMock = {
      upload: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommonService,
        { provide: STORAGE_SERVICE, useValue: storageServiceMock },
      ],
    }).compile();

    service = module.get<CommonService>(CommonService);
    storageService = module.get(STORAGE_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload the file when a file is provided', async () => {
    storageService.upload.mockResolvedValue('covers/cover.jpg');

    const result = await service.handleUploadFile('covers/cover.jpg', mockFile);

    expect(storageService.upload).toHaveBeenCalledWith(
      mockFile,
      'covers/cover.jpg',
    );
    expect(result).toBe('covers/cover.jpg');
  });

  it('should return null when no file is provided', async () => {
    const result = await service.handleUploadFile('covers/cover.jpg');

    expect(result).toBeNull();
    expect(storageService.upload).not.toHaveBeenCalled();
  });

  it('should return the transaction result when it resolves successfully', async () => {
    const transaction = Promise.resolve('created-entity');

    const result = await service.handleTransactionWithFile(
      'covers/cover.jpg',
      transaction,
    );

    expect(result).toBe('created-entity');
  });

  it('should remove the uploaded file when the transaction fails', async () => {
    const transaction = Promise.reject(new Error('transaction failed'));

    await expect(
      service.handleTransactionWithFile('covers/cover.jpg', transaction),
    ).rejects.toThrow('transaction failed');

    expect(storageService.remove).toHaveBeenCalledWith('covers/cover.jpg');
  });

  it('should not remove anything when the transaction fails and no file was uploaded', async () => {
    const transaction = Promise.reject(new Error('transaction failed'));

    await expect(
      service.handleTransactionWithFile(null, transaction),
    ).rejects.toThrow('transaction failed');

    expect(storageService.remove).not.toHaveBeenCalled();
  });
});
