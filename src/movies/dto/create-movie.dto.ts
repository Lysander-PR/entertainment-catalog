import {
  IsDate,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { onlyAlphaWithSpaces } from '@/common/helpers/messages-validator.helper';
import { alphaWithSpacesRegex } from '@/common/utils/regular-expressions.util';
import { Type } from 'class-transformer';

export class CreateMovieDto {
  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  director: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  title: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  writer: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  studio: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  protagonist: string;

  @IsDate()
  @Type(() => Date)
  releaseDate: Date;

  @IsOptional()
  @IsUrl()
  soundtrack?: string;
}
