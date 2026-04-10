import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { onlyAlphaWithSpacesString } from '@/common/utils/messages-validator.util';
import { alphaWithSpacesRegex } from '@/common/utils/regular-expressions.util';
import { onlyAlphaWithSpaces } from '@/common/helpers/messages-validator.helper';

export class CreateBookDto {
  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpacesString })
  @MinLength(1)
  @MaxLength(30)
  author: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @IsOptional()
  coWriter?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title: string;

  @IsDateString()
  releaseDate: Date;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  publisher: string;
}
