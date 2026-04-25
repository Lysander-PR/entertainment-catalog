import { cleanInputString } from '@/common/helpers/clean-input-string.helper';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => cleanInputString(value))
  description: string;
}
