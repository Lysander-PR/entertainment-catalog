import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { SupabaseService } from './supabase.service';
import { Cover } from './entities/cover.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cover])],
  controllers: [FilesController],
  providers: [FilesService, SupabaseService],
})
export class FilesModule {}
