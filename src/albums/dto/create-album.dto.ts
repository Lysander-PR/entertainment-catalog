import { CleanInput } from '@/common/decorators/clean-input.decorator';
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
import { ApiProperty } from '@nestjs/swagger';

class CreateSongByAlbumDto extends OmitType(CreateSongDto, [
  'albumId',
] as const) {}

export class CreateAlbumDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @CleanInput()
  @ApiProperty({
    description: 'Album title',
    example: 'Random Access Memories',
  })
  album!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @CleanInput()
  @ApiProperty({
    description: 'Production studio',
    example: 'Columbia',
  })
  studio!: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Album release date in ISO format',
    type: String,
    format: 'date',
    example: '2013-05-17',
  })
  releaseDate!: Date;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  @ApiProperty({
    description: 'Main artist name',
    example: 'Daft Punk',
  })
  artist!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSongByAlbumDto)
  @Transform(({ value }: { value: string | CreateSongByAlbumDto[] }) => {
    const arr = typeof value === 'string' ? JSON.parse(value) : value;
    return plainToInstance(CreateSongByAlbumDto, arr);
  })
  @ApiProperty({
    description:
      'List of songs for album creation. In multipart, send as JSON string array.',
    type: 'array',
    example: [
      {
        composer: 'Thomas Bangalter',
        title: 'Get Lucky',
        genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
      },
    ],
  })
  songs!: CreateSongByAlbumDto[];
}
