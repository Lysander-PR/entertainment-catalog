import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Song } from './entities/song.entity';
import { Genre } from './entities/genre.entity';
import { Album } from './entities/album.entity';

@Module({
  controllers: [SongsController],
  providers: [SongsService],
  imports: [TypeOrmModule.forFeature([Album, Genre, Song])],
})
export class SongsModule {}
