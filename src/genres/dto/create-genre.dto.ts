import { CleanInput } from '@/common/decorators/clean-input.decorator';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGenreDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @CleanInput()
  @ApiProperty({
    description: 'Genre description/name',
    example: 'Rock',
    maxLength: 50,
  })
  description!: string;
}
