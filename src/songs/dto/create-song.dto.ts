import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CleanInput } from '@/common/decorators/clean-input.decorator';

export class CreateSongDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  composer: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  @IsOptional()
  guestArtist?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @CleanInput()
  title: string;

  @IsUUID()
  albumId: string;

  @IsUUID()
  genreId: string;
}
