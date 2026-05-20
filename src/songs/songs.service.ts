import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Song } from './entities/song.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CheckDuplicatesParams } from './types/interfaces/check-duplicates-params.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { SONGS_PATH } from './types/consts/songs.const';
import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';

@Injectable()
export class SongsService {
  private readonly cacheKey = `/${APP_PREFIX}/${SONGS_PATH}`;

  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(createSongDto: CreateSongDto): Promise<Song> {
    await this.checkDuplicates({
      albumId: createSongDto.albumId,
      title: createSongDto.title,
    });

    const song = await this.songRepository.save(createSongDto);
    await this.cacheManager.del(this.cacheKey);
    return song;
  }

  findAll({ limit, page }: PaginationDto): Promise<Song[]> {
    return this.songRepository.find({
      take: limit,
      skip: (page - 1) * limit,
      where: { active: true },
      relations: { album: true, genre: true },
    });
  }

  async findOne(id: string): Promise<Song> {
    const song = await this.songRepository.findOne({
      where: { id, active: true },
      relations: { album: true, genre: true },
    });

    if (!song) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }

    return song;
  }

  async update(id: string, updateSongDto: UpdateSongDto): Promise<Song> {
    const song = await this.findOne(id);
    const albumId = updateSongDto.albumId || song.albumId;
    const title = updateSongDto.title || song.title;

    if (updateSongDto.albumId || updateSongDto.title) {
      await this.checkDuplicates({ id, albumId, title });
    }

    const songUpdated = this.songRepository.merge(song, updateSongDto);

    const result = await this.songRepository.update({ id }, songUpdated);
    if (result.affected === 0) {
      throw new InternalServerErrorException(
        `Failed to update song with id ${id}`,
      );
    }

    await this.cacheManager.del(`${this.cacheKey}/${id}`);
    await this.cacheManager.del(this.cacheKey);
    return songUpdated;
  }

  async remove(id: string): Promise<Song> {
    const song = await this.findOne(id);
    await this.songRepository.update({ id }, { active: false });
    await this.cacheManager.del(`${this.cacheKey}/${id}`);
    await this.cacheManager.del(this.cacheKey);
    return song;
  }

  async reactivate(id: string): Promise<Song> {
    const song = await this.songRepository.findOneBy({ id });

    if (!song) {
      throw new NotFoundException(`Song with id ${id} failed to reactivate`);
    }

    await this.songRepository.update({ id }, { active: true });
    return song;
  }

  private async checkDuplicates({
    id,
    albumId,
    title,
  }: CheckDuplicatesParams): Promise<void> {
    const exist = await this.songRepository.findOneBy({
      id: id ? Not(id) : undefined,
      albumId,
      title: capitalize(title),
    });

    if (exist) {
      throw new ConflictException(
        `Song with title ${title} already exists in the album with id ${albumId}`,
      );
    }
  }
}
