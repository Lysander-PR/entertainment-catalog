import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { cleanInputString } from '@/common/helpers/clean-input-string.helper';
import { Transform, Type } from 'class-transformer';

export class CreateSongDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  artist: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  composer: string;

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
  @Transform(({ value }: { value: string | undefined }) =>
    value ? cleanInputString(value) : undefined,
  )
  @IsOptional()
  guestArtist?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  title: string;

  @IsUUID()
  albumId: string;

  @IsUUID()
  genreId: string;
}
