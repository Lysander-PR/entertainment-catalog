import {
  ConflictException,
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
import { capitalizeSong } from '@/common/helpers/capitalize-entity.helper';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
  ) {}

  async create(createSongDto: CreateSongDto): Promise<Song> {
    await this.checkDuplicates({
      albumId: createSongDto.albumId,
      title: createSongDto.title,
    });

    return this.songRepository.save(capitalizeSong(createSongDto));
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

    const songUpdated = this.songRepository.merge(
      song,
      capitalizeSong(updateSongDto),
    );

    const result = await this.songRepository.update({ id }, songUpdated);
    if (result.affected === 0) {
      throw new InternalServerErrorException(
        `Failed to update song with id ${id}`,
      );
    }

    return songUpdated;
  }

  async remove(id: string): Promise<Song> {
    const song = await this.findOne(id);
    await this.songRepository.update({ id }, { active: false });
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
