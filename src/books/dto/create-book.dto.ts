import {
  IsDate,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { onlyAlphaWithSpacesString } from '@/common/utils/messages-validator.util';
import { alphaWithSpacesRegex } from '@/common/utils/regular-expressions.util';
import { onlyAlphaWithSpaces } from '@/common/helpers/messages-validator.helper';
import { cleanInputString } from '@/common/helpers/clean-input-string.helper';

export class CreateBookDto {
  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpacesString })
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  author: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value ? cleanInputString(value) : undefined,
  )
  coWriter?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  title: string;

  @IsDate()
  @Type(() => Date)
  releaseDate: Date;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  publisher: string;
}
