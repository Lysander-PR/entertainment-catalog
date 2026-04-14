import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  limit: number = 10;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;
}
