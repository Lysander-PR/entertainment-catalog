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
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { GENRES_PATH } from './types/consts/genres.const';
import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';

@Injectable()
export class GenresService {
  private readonly cacheKey = `/${APP_PREFIX}/${GENRES_PATH}`;

  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createGenreDto: CreateGenreDto): Promise<Genre> {
    const genre = await this.genreRepository.save({
      genre: capitalize(createGenreDto.description),
    });
    await this.cacheManager.del(this.cacheKey);
    return genre;
  }

  find({ limit, page }: PaginationDto): Promise<Genre[]> {
    return this.genreRepository.find({
      take: limit,
      skip: (page - 1) * limit,
    });
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
