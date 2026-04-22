export const STORAGE_SERVICE = 'IStorageService';

export interface IStorageService {
  upload(file: Express.Multer.File, fileName: string): Promise<string>;
  remove(path: string): Promise<void>;
  getFile(path: string): Promise<Blob>;
}
