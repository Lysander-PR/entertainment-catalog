import { Type } from 'class-transformer';
import {
  IsDate,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSongDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  artist: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  composer: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  studio: string;

  @IsDate()
  @Type(() => Date)
  releaseDate: Date;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  guestArtist: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title: string;

  @IsUUID()
  albumId: string;

  @IsUUID()
  genreId: string;
}
