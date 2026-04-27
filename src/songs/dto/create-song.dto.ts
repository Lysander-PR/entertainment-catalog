import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { cleanInputString } from '@/common/helpers/clean-input-string.helper';
import { Transform } from 'class-transformer';

export class CreateSongDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  composer: string;

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
