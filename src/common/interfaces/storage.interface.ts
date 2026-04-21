export const STORAGE_SERVICE = 'IStorageService';

export interface IStorageService {
  upload(file: Express.Multer.File): Promise<string>;
  remove(path: string): Promise<void>;
  getFile(path: string): Promise<Blob>;
}
