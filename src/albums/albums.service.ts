import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';

import { Album } from './entities/album.entity';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CommonService } from '@/common/common.service';
import { CheckDuplicatesParams } from './types/interfaces/check-duplicates-params.interface';
import { buildStoragePath } from '@/common/helpers/build-storage-path.helper';
import { BuildStoragePath } from './types/interfaces/build-storage-path';
import { Cover } from '@/files/entities/cover.entity';
import { Song } from '@/songs/entities/song.entity';

@Injectable()
export class AlbumsService {
  private readonly storageFolder = 'albums';

  constructor(
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
    private readonly commonService: CommonService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createAlbumDto: CreateAlbumDto,
    file?: Express.Multer.File,
  ): Promise<Album> {
    await this.checkDuplicates({
      album: createAlbumDto.album,
      artist: createAlbumDto.artist,
    });

    const uploadedPath = await this.commonService.handleUploadFile(
      this.storagePath({
        album: createAlbumDto.album,
        artist: createAlbumDto.artist,
      }),
      file,
    );

    return await this.commonService.handleTransactionWithFile(
      uploadedPath,
      this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        const songs = createAlbumDto.songs.map((song) =>
          manager.create(Song, song),
        );

        const album = manager.create(Album, { ...createAlbumDto, songs });

        if (uploadedPath) {
          const cover = await manager
            .getRepository(Cover)
            .save({ file: uploadedPath });

          album.coverId = cover.id;
        }

        const albumSaved = await manager.save(album);
        await manager.getRepository(Song).save(
          songs.map((song) => ({
            ...song,
            albumId: albumSaved.id,
          })),
        );

        return albumSaved;
      }),
    );
  }

  async find({ limit, page }: PaginationDto): Promise<Album[]> {
    return this.albumRepository.find({
      take: limit,
      skip: (page - 1) * limit,
      where: { active: true },
    });
  }

  async findOne(id: string): Promise<Album> {
    const album = await this.albumRepository.findOneBy({ id, active: true });

    if (!album) {
      throw new NotFoundException(`Album with id ${id} not found`);
    }

    return album;
  }

  async update(
    id: string,
    updateAlbumDto: UpdateAlbumDto,
    file?: Express.Multer.File,
  ): Promise<Album> {
    const album = await this.findOne(id);
    const artist = updateAlbumDto.artist || album.artist;
    const description = updateAlbumDto.album || album.album;

    if (updateAlbumDto.artist || updateAlbumDto.album) {
      await this.checkDuplicates({ id, album: description, artist });
    }

    const uploadedPath = await this.commonService.handleUploadFile(
      this.storagePath({ album: description, artist }),
      file,
    );
    const albumUpdated = this.albumRepository.merge(album, {
      ...updateAlbumDto,
      songs: album.songs,
    });

    return await this.commonService.handleTransactionWithFile(
      uploadedPath,
      this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        if (uploadedPath && !album.coverId) {
          const cover = await manager
            .getRepository(Cover)
            .save({ file: uploadedPath });

          albumUpdated.coverId = cover.id;
        }

        return await manager.save(albumUpdated);
      }),
    );
  }

  async remove(id: string): Promise<Album> {
    const album = await this.findOne(id);

    const result = await this.albumRepository.update({ id }, { active: false });
    if (result.affected === 0) {
      throw new InternalServerErrorException(
        `Failed to remove album with id ${id}`,
      );
    }

    await this.dataSource
      .getRepository(Song)
      .update({ albumId: id }, { active: false });

    return album;
  }

  async reactivate(id: string): Promise<Album> {
    const album = await this.albumRepository.findOneBy({ id });

    if (!album) {
      throw new NotFoundException(`Album with id ${id} failed to reactivate`);
    }

    await this.albumRepository.update({ id }, { active: true });
    await this.dataSource
      .getRepository(Song)
      .update({ albumId: id }, { active: true });

    return album;
  }

  private async checkDuplicates({
    id,
    album,
    artist,
  }: CheckDuplicatesParams): Promise<void> {
    const existBy = await this.albumRepository.existsBy({
      id: id ? Not(id) : undefined,
      album: capitalize(album),
      artist: capitalize(artist),
    });

    if (existBy) {
      throw new ConflictException(
        `Album with name "${album}" by artist "${artist}" already exists`,
      );
    }
  }

  private storagePath({ artist, album }: BuildStoragePath) {
    return buildStoragePath(this.storageFolder, artist, album);
  }
}
