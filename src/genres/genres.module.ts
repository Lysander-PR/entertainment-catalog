import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';
import { Genre } from './entities/genre.entity';
import { CommonModule } from '@/common/common.module';

@Module({
  controllers: [GenresController],
  providers: [GenresService],
  imports: [TypeOrmModule.forFeature([Genre]), CommonModule],
  exports: [GenresService],
})
export class GenresModule {}
