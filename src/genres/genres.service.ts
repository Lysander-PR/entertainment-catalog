import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Genre } from './entities/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  async create(createGenreDto: CreateGenreDto): Promise<Genre> {
    return this.genreRepository.save({ genre: createGenreDto.description });
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
      genre: updateGenreDto.description,
    });

    const result = await this.genreRepository.update({ id }, genreUpdated);
    if (result.affected === 0) {
      throw new InternalServerErrorException(
        `Failed to update genre with id ${id}`,
      );
    }

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

    return genre;
  }
}
