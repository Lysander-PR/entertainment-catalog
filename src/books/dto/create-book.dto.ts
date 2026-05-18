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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpacesString })
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  @ApiProperty({
    description: 'The name of the author of the book',
    example: ' Gabriel García Márquez',
    required: true,
  })
  author!: string;

  @IsString()
  @Matches(alphaWithSpacesRegex, { message: onlyAlphaWithSpaces })
  @MinLength(1)
  @MaxLength(30)
  @IsOptional()
  @CleanInput()
  @ApiPropertyOptional({
    description: 'The name of the co-writer of the book',
    example: 'Juan Perez',
  })
  coWriter?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @CleanInput()
  @ApiProperty({
    description: 'The title of the book',
    example: 'Cien Anos De Soledad',
    required: true,
  })
  title!: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Book release date in ISO format',
    example: '1967-05-30',
    type: String,
    format: 'date',
    required: true,
  })
  releaseDate!: Date;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @CleanInput()
  @ApiProperty({
    description: 'The publisher of the book',
    example: 'Sudamericana',
    required: true,
  })
  publisher!: string;
}
