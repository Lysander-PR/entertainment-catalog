import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponseDto<T> {
  data!: T[];

  @ApiProperty({
    description: 'Total of records matching the query (ignores pagination)',
    example: 42,
  })
  total!: number;

  @ApiProperty({
    description: 'Page currently returned (starts at 1)',
    example: 2,
  })
  currentPage!: number;

  @ApiProperty({
    description: 'Total number of pages available',
    example: 5,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Whether a page after the current one exists',
    example: true,
  })
  hasNextPage!: boolean;

  @ApiProperty({
    description: 'Whether a page before the current one exists',
    example: true,
  })
  hasPreviousPage!: boolean;

  constructor(data: T[], total: number, currentPage: number, limit: number) {
    this.data = data;
    this.total = total;
    this.currentPage = currentPage;
    this.totalPages = Math.ceil(total / limit);
    this.hasNextPage = currentPage < this.totalPages;
    this.hasPreviousPage = currentPage > 1;
  }
}
