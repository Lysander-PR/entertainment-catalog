import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cover } from './entities/cover.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(Cover)
    private readonly coverRepository: Repository<Cover>,
  ) {}

  async create(url: string): Promise<Cover> {
    return this.coverRepository.save({ file: url });
  }

  async findOne(id: string): Promise<Cover> {
    const cover = await this.coverRepository.findOneBy({ id });

    if (!cover) {
      throw new NotFoundException(`Cover with id ${id} not found`);
    }

    return cover;
  }

  async update(id: string, url: string): Promise<Cover> {
    const cover = await this.findOne(id);
    const fileUpdated = this.coverRepository.merge(cover, { file: url });
    await this.coverRepository.update({ id }, fileUpdated);
    return fileUpdated;
  }

  async remove(id: string): Promise<Cover> {
    const cover = await this.findOne(id);
    await this.coverRepository.delete({ id });
    return cover;
  }
}
