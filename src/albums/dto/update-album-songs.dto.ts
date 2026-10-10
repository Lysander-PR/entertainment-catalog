import { OmitType } from '@nestjs/mapped-types';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CreateSongDto } from '@/songs/dto/create-song.dto';
import { UpdateAlbumDto } from './update-album.dto';

export class SyncSongByAlbumDto extends OmitType(CreateSongDto, [
  'albumId',
] as const) {
  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Existing song id. Omit it to create a new song',
    format: 'uuid',
    example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
  })
  id?: string;
}

export class UpdateAlbumSongsDto extends UpdateAlbumDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SyncSongByAlbumDto)
  @Transform(({ value }: { value: string | SyncSongByAlbumDto[] }) => {
    const arr = typeof value === 'string' ? JSON.parse(value) : value;
    return plainToInstance(SyncSongByAlbumDto, arr);
  })
  @ApiProperty({
    description:
      'Full tracklist of the album. Songs with id are updated, songs without id are created, and every active song missing from the list is deactivated. In multipart, send as JSON string array.',
    type: 'array',
    example: [
      {
        id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
        composer: 'Thomas Bangalter',
        title: 'Get Lucky',
        genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
      },
      {
        composer: 'Guy-Manuel De Homem-Christo',
        title: 'Instant Crush',
        genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
      },
    ],
  })
  songs!: SyncSongByAlbumDto[];
}
