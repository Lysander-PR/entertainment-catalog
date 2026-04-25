import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Song } from './entities/song.entity';
import { CommonModule } from '@/common/common.module';

@Module({
  controllers: [SongsController],
  providers: [SongsService],
  imports: [TypeOrmModule.forFeature([Song]), CommonModule],
})
export class SongsModule {}
