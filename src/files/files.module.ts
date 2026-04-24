import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { SupabaseService } from './supabase.service';
import { Cover } from './entities/cover.entity';
import { STORAGE_SERVICE } from '@/common/interfaces/storage.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Cover])],
  controllers: [FilesController],
  providers: [
    FilesService,
    { provide: STORAGE_SERVICE, useClass: SupabaseService },
  ],
  exports: [FilesService, STORAGE_SERVICE],
})
export class FilesModule {}
