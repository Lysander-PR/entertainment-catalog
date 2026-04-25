import { cleanInputString } from '@/common/helpers/clean-input-string.helper';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  description: string;
}
