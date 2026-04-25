import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';

import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Song } from './entities/song.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CommonService } from '@/common/common.service';
import { CheckDuplicatesParams } from './types/interfaces/check-duplicates-params.interface';
import { BuildStoragePath } from './types/interfaces/build-storage-path';
import { buildStoragePath } from '@/common/helpers/build-storage-path.helper';
import { Cover } from '@/files/entities/cover.entity';

@Injectable()
export class SongsService {
  private readonly storageFolder = 'songs';

  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    private readonly commonService: CommonService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createSongDto: CreateSongDto,
    file?: Express.Multer.File,
  ): Promise<Song> {
    await this.checkDuplicates({
      artist: createSongDto.artist,
      title: createSongDto.title,
    });

    const uploadedPath = await this.commonService.handleUploadFile(
      this.storagePath({
        title: createSongDto.title,
        artist: createSongDto.artist,
      }),
      file,
    );

    return await this.commonService.handleTransactionWithFile(
      uploadedPath,
      this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        const song = manager.create(Song, this.capitalizeSong(createSongDto));

        if (uploadedPath) {
          const cover = await manager
            .getRepository(Cover)
            .save({ file: uploadedPath });

          song.coverId = cover.id;
        }

        return await manager.save(song);
      }),
    );
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

  async update(
    id: string,
    updateSongDto: UpdateSongDto,
    file?: Express.Multer.File,
  ): Promise<Song> {
    const song = await this.findOne(id);
    const artist = updateSongDto.artist || song.artist;
    const title = updateSongDto.title || song.title;

    if (updateSongDto.artist || updateSongDto.title) {
      await this.checkDuplicates({ id, artist, title });
    }

    const uploadedPath = await this.commonService.handleUploadFile(
      this.storagePath({ title, artist }),
      file,
    );
    const songUpdated = this.songRepository.merge(
      song,
      this.capitalizeSong(updateSongDto),
    );

    return await this.commonService.handleTransactionWithFile(
      uploadedPath,
      this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        if (uploadedPath && !song.coverId) {
          const cover = await manager
            .getRepository(Cover)
            .save({ file: uploadedPath });

          songUpdated.coverId = cover.id;
        }

        return await manager.save(songUpdated);
      }),
    );
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
      artist: songLike.artist ? capitalize(songLike.artist) : undefined,
      composer: songLike.composer ? capitalize(songLike.composer) : undefined,
      studio: songLike.studio ? capitalize(songLike.studio) : undefined,
      title: songLike.title ? capitalize(songLike.title) : undefined,
      guestArtist: songLike.guestArtist
        ? capitalize(songLike.guestArtist)
        : undefined,
    };
  }

  private async checkDuplicates({
    id,
    artist,
    title,
  }: CheckDuplicatesParams): Promise<void> {
    const exist = await this.songRepository.findOneBy({
      id: id ? Not(id) : undefined,
      artist: capitalize(artist),
      title: capitalize(title),
    });

    if (exist) {
      throw new ConflictException(
        `Song with title ${title} and artist ${artist} already exists`,
      );
    }
  }

  private storagePath({ artist, title }: BuildStoragePath) {
    return buildStoragePath(this.storageFolder, artist, title);
  }
}
