import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Album } from './entities/album.entity';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
  ) {}

  async create(createAlbumDto: CreateAlbumDto): Promise<Album> {
    return this.albumRepository.save({ album: createAlbumDto.description });
  }

  async findOne(id: string): Promise<Album> {
    const album = await this.albumRepository.findOneBy({ id });

    if (!album) {
      throw new NotFoundException(`Album with id ${id} not found`);
    }

    return album;
  }

  async update(id: string, updateAlbumDto: UpdateAlbumDto): Promise<Album> {
    const album = await this.findOne(id);
    const albumUpdated = this.albumRepository.merge(album, {
      album: updateAlbumDto.description,
    });

    const result = await this.albumRepository.update({ id }, albumUpdated);
    if (result.affected === 0) {
      throw new InternalServerErrorException(
        `Failed to update album with id ${id}`,
      );
    }

    return albumUpdated;
  }

  async remove(id: string): Promise<Album> {
    const album = await this.findOne(id);

    const result = await this.albumRepository.delete({ id });
    if (result.affected === 0) {
      throw new InternalServerErrorException(
        `Failed to remove genre with id ${id}`,
      );
    }

    return album;
  }
}
