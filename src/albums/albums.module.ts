import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { Album } from './entities/album.entity';
import { CommonModule } from '@/common/common.module';

@Module({
  controllers: [AlbumsController],
  providers: [AlbumsService],
  imports: [TypeOrmModule.forFeature([Album]), CommonModule],
  exports: [AlbumsService],
})
export class AlbumsModule {}
