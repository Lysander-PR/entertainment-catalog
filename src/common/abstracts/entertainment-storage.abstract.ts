import { CacheKey } from './cache-key.abstract';
import { FolderNameForBucket } from '@/common/types/interfaces/storage-folder-entertainment.interface';

export abstract class EntertainmentStorage
  extends CacheKey
  implements FolderNameForBucket
{
  readonly storageFolder: string;

  protected constructor(folder: string) {
    super(folder);
    this.storageFolder = folder;
  }
}
