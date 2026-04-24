import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';
import { Repository } from 'typeorm';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { FilesService } from '@/files/files.service';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly filesService: FilesService,
  ) {}

  async create(
    createMovieDto: CreateMovieDto,
    file?: Express.Multer.File,
  ): Promise<Movie> {
    await this.checkDuplicates(
      createMovieDto.title,
      createMovieDto.director,
      createMovieDto.studio,
    );

    let posterId: string | undefined;
    if (file) {
      const cover = await this.filesService.create(file);
      posterId = cover.id;
    }

    const movie = this.movieRepository.create({
      posterId,
      ...this.capitalizeMovie(createMovieDto),
    });
    return this.movieRepository.save(movie);
  }

  findAll(paginationDto: PaginationDto): Promise<Movie[]> {
    const { limit, page } = paginationDto;
    return this.movieRepository.find({
      take: limit,
      skip: (page - 1) * limit,
      where: { active: true },
    });
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.movieRepository.findOneBy({ id, active: true });

    if (!movie) {
      throw new NotFoundException(`Movie with id ${id} not found`);
    }

    return movie;
  }

  async update(
    id: string,
    updateMovieDto: UpdateMovieDto,
    file?: Express.Multer.File,
  ): Promise<Movie> {
    const movie = await this.findOne(id);

    if (
      updateMovieDto.director ||
      updateMovieDto.studio ||
      updateMovieDto.title
    ) {
      const title = updateMovieDto.title || movie.title;
      const director = updateMovieDto.director || movie.director;
      const studio = updateMovieDto.studio || movie.studio;

      await this.checkDuplicates(title, director, studio);
    }

    const movieUpdated = this.movieRepository.merge(
      movie,
      this.capitalizeMovie(updateMovieDto),
    );

    await this.movieRepository.update({ id }, movieUpdated);

    return movieUpdated;
  }

  async remove(id: string): Promise<Movie> {
    const movie = await this.findOne(id);
    await this.movieRepository.update({ id }, { active: false });
    return movie;
  }

  async reactivate(id: string): Promise<Movie> {
    const movie = await this.movieRepository.findOneBy({ id });

    if (!movie) {
      throw new NotFoundException(`Movie with id ${id} failed to reactivate`);
    }

    await this.movieRepository.update({ id }, { active: true });
    return movie;
  }

  private capitalizeMovie(likeMovie: Partial<Movie>): Partial<Movie> {
    return {
      ...likeMovie,
      director: capitalize(likeMovie.director || ''),
      title: capitalize(likeMovie.title || ''),
      writer: capitalize(likeMovie.writer || ''),
      studio: capitalize(likeMovie.studio || ''),
      protagonist: capitalize(likeMovie.protagonist || ''),
    };
  }

  private async checkDuplicates(
    title: string,
    director: string,
    studio: string,
  ): Promise<void> {
    const exist = await this.movieRepository.existsBy({
      director: capitalize(director),
      title: capitalize(title),
      studio: capitalize(studio),
    });

    if (exist) {
      throw new ConflictException(
        `Movie with title "${title}", director "${director}" and studio ${studio} already exists`,
      );
    }
  }
}
