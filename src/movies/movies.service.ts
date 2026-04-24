import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  type IStorageService,
  STORAGE_SERVICE,
} from '@/common/interfaces/storage.interface';
import { Cover } from '@/files/entities/cover.entity';
import { BuildStoragePath } from './interfaces/build-storage-path';

@Injectable()
export class MoviesService {
  private readonly storageFolder = 'movies';

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    private readonly dataSource: DataSource,
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

    const uploadedPath = await this.handleUploadFile(
      this.buildStoragePath({
        director: createMovieDto.director,
        studio: createMovieDto.studio,
        title: createMovieDto.title,
      }),
      file,
    );

    try {
      return await this.dataSource.transaction(
        'SERIALIZABLE',
        async (manager) => {
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
        },
      );
    } catch (error) {
      if (uploadedPath) {
        await this.storageService.remove(uploadedPath);
      }

      throw error;
    }
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
      await this.checkDuplicates(title, director, studio);
    }

    const uploadedPath = await this.handleUploadFile(
      this.buildStoragePath({ director, studio, title }),
      file,
    );
    const movieUpdated = this.movieRepository.merge(
      movie,
      this.capitalizeMovie(updateMovieDto),
    );

    try {
      return await this.dataSource.transaction(
        'SERIALIZABLE',
        async (manager) => {
          if (uploadedPath && !movie.posterId) {
            const cover = await manager
              .getRepository(Cover)
              .save({ file: uploadedPath });

            movieUpdated.posterId = cover.id;
          }

          await manager.update(Movie, { id }, movieUpdated);
          return movieUpdated;
        },
      );
    } catch (error) {
      if (uploadedPath) {
        await this.storageService.remove(uploadedPath);
      }

      throw error;
    }
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
      director: capitalize(likeMovie.director || '').trim(),
      title: capitalize(likeMovie.title || '').trim(),
      writer: capitalize(likeMovie.writer || '').trim(),
      studio: capitalize(likeMovie.studio || '').trim(),
      protagonist: capitalize(likeMovie.protagonist || '').trim(),
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

  private buildStoragePath({
    studio,
    director,
    title,
  }: BuildStoragePath): string {
    return `${this.storageFolder}/${studio}_${director}_${title}`
      .toLowerCase()
      .replaceAll(' ', '-');
  }

  private async handleUploadFile(
    fileName: string,
    file?: Express.Multer.File,
  ): Promise<string | null> {
    if (file) {
      return this.storageService.upload(file, fileName);
    }

    return null;
  }
}
