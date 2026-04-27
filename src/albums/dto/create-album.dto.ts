import { cleanInputString } from '@/common/helpers/clean-input-string.helper';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(50, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [cleanInputString(value)];
    }

    return Array.isArray(value)
      ? value.map(cleanInputString)
      : [cleanInputString(value)];
  })
  songs: string[];
}
