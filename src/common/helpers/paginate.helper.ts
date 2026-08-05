import { FindManyOptions, ObjectLiteral, Repository } from 'typeorm';

import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';

export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  paginationDto: PaginationDto,
  options: FindManyOptions<T> = {},
): Promise<PaginationResponseDto<T>> {
  const { limit, page } = paginationDto;
  const [data, total] = await repository.findAndCount({
    ...options,
    take: limit,
    skip: (page - 1) * limit,
  });

  return new PaginationResponseDto(data, total, page, limit);
}
