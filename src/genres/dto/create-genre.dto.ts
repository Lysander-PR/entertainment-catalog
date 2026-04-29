import { CleanInput } from '@/common/decorators/clean-input.decorator';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @CleanInput()
  description: string;
}
