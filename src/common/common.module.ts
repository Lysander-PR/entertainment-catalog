import { FilesModule } from '@/files/files.module';
import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CacheService } from './cache/cache.service';

@Module({
  imports: [FilesModule],
  providers: [CommonService, CacheService],
  exports: [CommonService, CacheService],
})
export class CommonModule {}
