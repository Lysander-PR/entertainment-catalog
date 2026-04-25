import { FilesModule } from '@/files/files.module';
import { Module } from '@nestjs/common';
import { CommonService } from './common.service';

@Module({
  imports: [FilesModule],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
