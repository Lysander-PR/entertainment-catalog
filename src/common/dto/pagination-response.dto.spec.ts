import { PaginationResponseDto } from './pagination-response.dto';

describe('PaginationResponseDto', () => {
  it('should keep the received data and total untouched', () => {
    const data = [{ id: '1' }, { id: '2' }];

    const dto = new PaginationResponseDto(data, 25, 1, 10);

    expect(dto.data).toBe(data);
    expect(dto.total).toBe(25);
    expect(dto.currentPage).toBe(1);
  });

  it('should round totalPages up when the last page is partial', () => {
    const dto = new PaginationResponseDto([], 11, 1, 10);

    expect(dto.totalPages).toBe(2);
  });

  it('should not add an extra page when total divides exactly by limit', () => {
    const dto = new PaginationResponseDto([], 20, 1, 10);

    expect(dto.totalPages).toBe(2);
  });

  it('should flag only a next page on the first page', () => {
    const dto = new PaginationResponseDto([], 25, 1, 10);

    expect(dto.hasNextPage).toBe(true);
    expect(dto.hasPreviousPage).toBe(false);
  });

  it('should flag both pages on an intermediate page', () => {
    const dto = new PaginationResponseDto([], 25, 2, 10);

    expect(dto.hasNextPage).toBe(true);
    expect(dto.hasPreviousPage).toBe(true);
  });

  it('should flag only a previous page on the last page', () => {
    const dto = new PaginationResponseDto([], 25, 3, 10);

    expect(dto.hasNextPage).toBe(false);
    expect(dto.hasPreviousPage).toBe(true);
  });

  it('should flag no pages when a single page holds every record', () => {
    const dto = new PaginationResponseDto([], 10, 1, 10);

    expect(dto.totalPages).toBe(1);
    expect(dto.hasNextPage).toBe(false);
    expect(dto.hasPreviousPage).toBe(false);
  });

  it('should report zero pages when there are no records', () => {
    const dto = new PaginationResponseDto([], 0, 1, 10);

    expect(dto.totalPages).toBe(0);
    expect(dto.hasNextPage).toBe(false);
    expect(dto.hasPreviousPage).toBe(false);
  });
});
