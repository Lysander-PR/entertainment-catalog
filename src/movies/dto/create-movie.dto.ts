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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieDto {
  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  @ApiProperty({
    description: 'Movie director name',
    example: 'Denis Villeneuve',
  })
  director!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  @ApiProperty({
    description: 'Movie title',
    example: 'Dune',
  })
  title!: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  @ApiProperty({
    description: 'Movie writer name',
    example: 'Jon Spaihts',
  })
  writer!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @CleanInput()
  @ApiProperty({
    description: 'Production studio',
    example: 'Warner Bros',
  })
  studio!: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  @ApiProperty({
    description: 'Main protagonist actor/actress',
    example: 'Timothee Chalamet',
  })
  protagonist!: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Movie release date in ISO format',
    type: String,
    format: 'date',
    example: '2021-10-22',
  })
  releaseDate!: Date;

  @IsOptional()
  @IsUrl()
  @CleanInput()
  @ApiPropertyOptional({
    description: 'Optional soundtrack URL',
    example: 'https://open.spotify.com/track/example',
  })
  soundtrack?: string;
}
