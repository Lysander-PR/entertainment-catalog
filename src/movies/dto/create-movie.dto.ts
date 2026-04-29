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
import { CleanInput } from '@/common/decorators/clean-input.decorator';

export class CreateMovieDto {
  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  director: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  title: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  writer: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @CleanInput()
  studio: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  protagonist: string;

  @IsDate()
  @Type(() => Date)
  releaseDate: Date;

  @IsOptional()
  @IsUrl()
  @CleanInput()
  soundtrack?: string;
}
