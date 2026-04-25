import { Inject, Injectable } from '@nestjs/common';
import {
  type IStorageService,
  STORAGE_SERVICE,
} from './interfaces/storage.interface';

@Injectable()
export class CommonService {
  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
  ) {}

  async handleUploadFile(
    fileName: string,
    file?: Express.Multer.File,
  ): Promise<string | null> {
    if (file) {
      return this.storageService.upload(file, fileName);
    }

    return null;
  }

  async handleTransactionWithFile<T>(
    uploadedPath: string | null,
    transaction: Promise<T>,
  ): Promise<T> {
    try {
      return await transaction;
    } catch (error) {
      if (uploadedPath) {
        await this.storageService.remove(uploadedPath);
      }
      throw error;
    }
  }
}
