import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Cover } from '@/files/entities/cover.entity';
import { BuildStoragePath } from './interfaces/build-storage-path';
import { CheckDuplicatesParams } from './interfaces/check-duplicates-params';
import { buildStoragePath } from '@/common/helpers/build-storage-path.helper';
import { CommonService } from '@/common/common.service';

@Injectable()
export class MoviesService {
  private readonly storageFolder = 'movies';

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly commonService: CommonService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createMovieDto: CreateMovieDto,
    file?: Express.Multer.File,
  ): Promise<Movie> {
    await this.checkDuplicates({
      title: createMovieDto.title,
      director: createMovieDto.director,
      studio: createMovieDto.studio,
    });

    const uploadedPath = await this.commonService.handleUploadFile(
      this.storagePath({
        director: createMovieDto.director,
        studio: createMovieDto.studio,
        title: createMovieDto.title,
      }),
      file,
    );

    return await this.commonService.handleTransactionWithFile(
      uploadedPath,
      this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        const movie = manager.create(
          Movie,
          this.capitalizeMovie(createMovieDto),
        );

        if (uploadedPath) {
          const cover = await manager
            .getRepository(Cover)
            .save({ file: uploadedPath });

          movie.posterId = cover.id;
        }

        return await manager.save(movie);
      }),
    );
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

    const title = updateMovieDto.title || movie.title;
    const director = updateMovieDto.director || movie.director;
    const studio = updateMovieDto.studio || movie.studio;

    if (
      updateMovieDto.director ||
      updateMovieDto.studio ||
      updateMovieDto.title
    ) {
      await this.checkDuplicates({ title, director, studio, id });
    }

    const uploadedPath = await this.commonService.handleUploadFile(
      this.storagePath({ director, studio, title }),
      file,
    );
    const movieUpdated = this.movieRepository.merge(
      movie,
      this.capitalizeMovie(updateMovieDto),
    );

    return await this.commonService.handleTransactionWithFile(
      uploadedPath,
      this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        if (uploadedPath && !movie.posterId) {
          const cover = await manager
            .getRepository(Cover)
            .save({ file: uploadedPath });

          movieUpdated.posterId = cover.id;
        }

        await manager.update(Movie, { id }, movieUpdated);
        return movieUpdated;
      }),
    );
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
      director: likeMovie.director ? capitalize(likeMovie.director) : undefined,
      title: likeMovie.title ? capitalize(likeMovie.title) : undefined,
      writer: likeMovie.writer ? capitalize(likeMovie.writer) : undefined,
      studio: likeMovie.studio ? capitalize(likeMovie.studio) : undefined,
      protagonist: likeMovie.protagonist
        ? capitalize(likeMovie.protagonist)
        : undefined,
    };
  }

  private async checkDuplicates({
    id,
    title,
    director,
    studio,
  }: CheckDuplicatesParams): Promise<void> {
    const exist = await this.movieRepository.existsBy({
      id: id ? Not(id) : undefined,
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

  private storagePath({ studio, director, title }: BuildStoragePath): string {
    return buildStoragePath(this.storageFolder, studio, director, title);
  }
}
