import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cover } from './entities/cover.entity';
import { SupabaseService } from './supabase.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Cover)
    private readonly coverRepository: Repository<Cover>,
    private readonly supabaseService: SupabaseService,
  ) {}

  async create(file: Express.Multer.File): Promise<Cover> {
    const url = await this.supabaseService.upload(file);
    return this.coverRepository.save({ file: url });
  }

  async findOne(id: string): Promise<Cover> {
    const cover = await this.coverRepository.findOneBy({ id });

    if (!cover) {
      throw new NotFoundException(`Cover with id ${id} not found`);
    }

    return cover;
  }

  async getFile(id: string): Promise<Blob> {
    const cover = await this.findOne(id);
    return this.supabaseService.getFile(cover.file);
  }

  async update(id: string, file: Express.Multer.File): Promise<Cover> {
    const url = await this.supabaseService.upload(file);

    const cover = await this.findOne(id);
    const fileUpdated = this.coverRepository.merge(cover, { file: url });
    await this.coverRepository.update({ id }, fileUpdated);
    return fileUpdated;
  }

  async remove(id: string): Promise<Cover> {
    const cover = await this.findOne(id);
    await this.coverRepository.delete({ id });
    await this.supabaseService.remove(cover.file);

    return cover;
  }
}
