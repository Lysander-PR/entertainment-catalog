import { cleanInputString } from '@/common/helpers/clean-input-string.helper';
import { CreateSongDto } from '@/songs/dto/create-song.dto';
import { OmitType } from '@nestjs/mapped-types';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

class CreateSongByAlbumDto extends OmitType(CreateSongDto, [
  'albumId',
] as const) {}

export class CreateAlbumDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  album: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  studio: string;

  @IsDate()
  @Type(() => Date)
  releaseDate: Date;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  artist: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSongByAlbumDto)
  @Transform(({ value }: { value: string | CreateSongByAlbumDto[] }) => {
    const arr = typeof value === 'string' ? JSON.parse(value) : value;
    return plainToInstance(CreateSongByAlbumDto, arr);
  })
  songs: CreateSongByAlbumDto[];
}
