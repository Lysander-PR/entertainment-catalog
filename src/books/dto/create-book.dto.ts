import {
  IsDate,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

import { onlyAlphaWithSpacesString } from '@/common/utils/messages-validator.util';
import { alphaWithSpacesRegex } from '@/common/utils/regular-expressions.util';
import { onlyAlphaWithSpaces } from '@/common/helpers/messages-validator.helper';
import { CleanInput } from '@/common/decorators/clean-input.decorator';

export class CreateBookDto {
  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpacesString })
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  author: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @IsOptional()
  @CleanInput()
  coWriter?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @CleanInput()
  title: string;

  @IsDate()
  @Type(() => Date)
  releaseDate: Date;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @CleanInput()
  publisher: string;
}
