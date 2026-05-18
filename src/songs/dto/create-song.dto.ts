import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { CleanInput } from '@/common/decorators/clean-input.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSongDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  @ApiProperty({
    description: 'Song composer',
    example: 'Hans Zimmer',
  })
  composer!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @CleanInput()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Optional guest artist',
    example: 'Billie Eilish',
  })
  guestArtist?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @CleanInput()
  @ApiProperty({
    description: 'Song title',
    example: 'Time',
  })
  title!: string;

  @IsUUID()
  @ApiProperty({
    description: 'Album id',
    format: 'uuid',
    example: 'af6a9f14-b560-4f84-89c4-8ebf9d18a744',
  })
  albumId!: string;

  @IsUUID()
  @ApiProperty({
    description: 'Genre id',
    format: 'uuid',
    example: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
  })
  genreId!: string;
}
