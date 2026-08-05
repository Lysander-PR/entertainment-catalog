import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Genre } from './entities/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { paginate } from '@/common/helpers/paginate.helper';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { GENRES_PATH } from './types/consts/genres.const';
import { CacheKey } from '@/common/abstracts/cache-key.abstract';

@Injectable()
export class GenresService extends CacheKey {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    super(GENRES_PATH);
  }

  async create(createGenreDto: CreateGenreDto): Promise<Genre> {
    const genre = await this.genreRepository.save({
      genre: capitalize(createGenreDto.description),
    });
    await this.cacheManager.del(this.cacheKey);
    return genre;
  }

  find(paginationDto: PaginationDto): Promise<PaginationResponseDto<Genre>> {
    return paginate(this.genreRepository, paginationDto);
  }

  findAll(): Promise<Genre[]> {
    return this.genreRepository.find();
  }

  async findOne(id: string): Promise<Genre> {
    const genre = await this.genreRepository.findOneBy({ id });

    if (!genre) {
      throw new NotFoundException(`Genre with id ${id} not found`);
    }

    return genre;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto): Promise<Genre> {
    const genre = await this.findOne(id);
    const genreUpdated = this.genreRepository.merge(genre, {
      genre: updateGenreDto.description
        ? capitalize(updateGenreDto.description)
        : undefined,
    });

    const result = await this.genreRepository.update({ id }, genreUpdated);
    if (result.affected === 0) {
      throw new InternalServerErrorException(
        `Failed to update genre with id ${id}`,
      );
    }

    await this.cacheManager.del(`${this.cacheKey}/${id}`);
    await this.cacheManager.del(this.cacheKey);
    return genreUpdated;
  }

  async remove(id: string): Promise<Genre> {
    const genre = await this.findOne(id);

    const result = await this.genreRepository.delete({ id });
    if (result.affected === 0) {
      throw new InternalServerErrorException(
        `Failed to remove genre with id ${id}`,
      );
    }

    await this.cacheManager.del(`${this.cacheKey}/${id}`);
    await this.cacheManager.del(this.cacheKey);
    return genre;
  }
}
