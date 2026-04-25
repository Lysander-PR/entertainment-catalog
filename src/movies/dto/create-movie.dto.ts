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
import { Transform, Type } from 'class-transformer';
import { cleanInputString } from '@/common/helpers/clean-input-string.helper';

export class CreateMovieDto {
  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  director: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  title: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  writer: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  studio: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  protagonist: string;

  @IsDate()
  @Type(() => Date)
  releaseDate: Date;

  @IsOptional()
  @IsUrl()
  @Transform(({ value }: { value?: string }) =>
    value ? cleanInputString(value) : value,
  )
  soundtrack?: string;
}
