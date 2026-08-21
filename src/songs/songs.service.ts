import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';

import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Song } from './entities/song.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { paginate } from '@/common/helpers/paginate.helper';
import { CheckDuplicatesParams } from './types/interfaces/check-duplicates-params.interface';
import { SONGS_PATH } from './types/consts/songs.const';
import { CacheKey } from '@/common/abstracts/cache-key.abstract';
import { CacheService } from '@/common/cache/cache.service';
import { SyncSongByAlbumDto } from '@/albums/dto/update-album-songs.dto';
import {
  buildIdsToDeactivate,
  buildToCreate,
  buildToUpdate,
} from './helpers/build-songs.helper';

@Injectable()
export class SongsService extends CacheKey {
  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    private readonly cacheService: CacheService,
    private readonly dataSource: DataSource,
  ) {
    super(SONGS_PATH);
  }

  async create(createSongDto: CreateSongDto): Promise<Song> {
    await this.checkDuplicates({
      albumId: createSongDto.albumId,
      title: createSongDto.title,
    });

    const song = this.songRepository.create(createSongDto);
    const songSaved = await this.songRepository.save(song);
    await this.cacheService.deleteByPrefix(this.cacheKey);
    return songSaved;
  }

  findAll(paginationDto: PaginationDto): Promise<PaginationResponseDto<Song>> {
    return paginate(this.songRepository, paginationDto, {
      where: { active: true },
      relations: { album: true, genre: true },
    });
  }

  findByAlbum(albumId: string): Promise<Song[]> {
    return this.songRepository.find({
      where: { albumId, active: true },
      relations: { genre: true },
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

    await this.cacheService.deleteByPrefix(this.cacheKey);
    return songUpdated;
  }

  async remove(id: string): Promise<Song> {
    const song = await this.findOne(id);
    await this.songRepository.update({ id }, { active: false });
    await this.cacheService.deleteByPrefix(this.cacheKey);
    return song;
  }

  async reactivate(id: string): Promise<Song> {
    const song = await this.songRepository.findOneBy({ id });

    if (!song) {
      throw new NotFoundException(`Song with id ${id} failed to reactivate`);
    }

    await this.songRepository.update({ id }, { active: true });
    await this.cacheService.deleteByPrefix(this.cacheKey);
    return song;
  }

  async reactivateByAlbumId(albumId: string): Promise<Song[]> {
    const songs = await this.songRepository.findBy({ albumId, active: false });

    if (songs.length === 0) {
      return songs;
    }

    await this.songRepository.update(
      { albumId, active: false },
      { active: true },
    );
    await this.cacheService.deleteByPrefix(this.cacheKey);

    return this.songRepository.findBy({ albumId });
  }

  async syncByAlbumId(
    albumId: string,
    songs: SyncSongByAlbumDto[],
  ): Promise<Song[]> {
    this.checkDuplicatesInPayload(albumId, songs);
    const songsInAlbum = await this.findByAlbum(albumId);

    const idsToDeactivate = buildIdsToDeactivate(songsInAlbum, songs);
    const songsToCreate = buildToCreate(albumId, songs, this.songRepository);
    const songsToUpdate = buildToUpdate(songsInAlbum, songs);

    await this.dataSource.transaction(async (manager) => {
      if (songsToCreate.length) {
        await manager.insert(Song, songsToCreate);
      }

      if (idsToDeactivate.length) {
        await manager.update(
          Song,
          { id: In(idsToDeactivate) },
          { active: false },
        );
      }

      for (const songLike of songsToUpdate) {
        await manager.update(Song, { id: songLike.id }, songLike);
      }
    });

    await this.cacheService.deleteByPrefix(this.cacheKey);
    return this.findByAlbum(albumId);
  }

  private checkDuplicatesInPayload(
    albumId: string,
    songs: SyncSongByAlbumDto[],
  ): void {
    const titles = new Set<string>();

    for (const { title } of songs) {
      const song = title.toLocaleLowerCase();

      if (titles.has(song)) {
        throw new ConflictException(
          `Song with title ${title} is duplicated in the album with id ${albumId}`,
        );
      }

      titles.add(song);
    }
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
