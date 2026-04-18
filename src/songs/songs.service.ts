import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Song } from './entities/song.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
  ) {}

  async create(createSongDto: CreateSongDto): Promise<Song> {
    await this.checkDuplicates(createSongDto.artist, createSongDto.title);
    const song = this.songRepository.create(this.capitalizeSong(createSongDto));
    return this.songRepository.save(song);
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

    if (updateSongDto.artist || updateSongDto.title) {
      const artist = updateSongDto.artist || song.artist;
      const title = updateSongDto.title || song.title;

      await this.checkDuplicates(artist, title);
    }

    const songUpdated = this.songRepository.merge(
      song,
      this.capitalizeSong(updateSongDto),
    );

    await this.songRepository.update({ id }, songUpdated);
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

  private capitalizeSong(songLike: Partial<Song>): Partial<Song> {
    return {
      ...songLike,
      artist: capitalize(songLike.artist || ''),
      composer: capitalize(songLike.composer || ''),
      studio: capitalize(songLike.studio || ''),
      guestArtist: capitalize(songLike.guestArtist || ''),
      title: capitalize(songLike.title || ''),
    };
  }

  private async checkDuplicates(artist: string, title: string): Promise<void> {
    const exist = await this.songRepository.findOneBy({
      artist: capitalize(artist),
      title: capitalize(title),
    });

    if (exist) {
      throw new ConflictException(
        `Song with title ${title} and artist ${artist} already exists`,
      );
    }
  }
}
