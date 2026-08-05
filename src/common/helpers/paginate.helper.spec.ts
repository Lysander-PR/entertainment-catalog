import { Repository } from 'typeorm';

import { paginate } from './paginate.helper';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';

interface TestEntity {
  id: string;
  active: boolean;
}

describe('paginate', () => {
  let repository: jest.Mocked<Pick<Repository<TestEntity>, 'findAndCount'>>;

  beforeEach(() => {
    repository = { findAndCount: jest.fn() };
  });

  const paginateWith = (page: number, limit: number, options = {}) =>
    paginate(
      repository as unknown as Repository<TestEntity>,
      { page, limit },
      options,
    );

  it('should translate page and limit into take and skip', async () => {
    repository.findAndCount.mockResolvedValue([[], 0]);

    await paginateWith(3, 5);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      take: 5,
      skip: 10,
    });
  });

  it('should not skip any record on the first page', async () => {
    repository.findAndCount.mockResolvedValue([[], 0]);

    await paginateWith(1, 10);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      take: 10,
      skip: 0,
    });
  });

  it('should merge the received find options', async () => {
    repository.findAndCount.mockResolvedValue([[], 0]);

    await paginateWith(1, 10, { where: { active: true } });

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { active: true },
      take: 10,
      skip: 0,
    });
  });

  it('should build the pagination response from the found records', async () => {
    const entity: TestEntity = { id: 'entity-id', active: true };
    repository.findAndCount.mockResolvedValue([[entity], 11]);

    const result = await paginateWith(2, 5);

    expect(result).toEqual(new PaginationResponseDto([entity], 11, 2, 5));
    expect(result).toBeInstanceOf(PaginationResponseDto);
  });

  it('should build an empty pagination response when nothing matches', async () => {
    repository.findAndCount.mockResolvedValue([[], 0]);

    const result = await paginateWith(1, 10);

    expect(result).toEqual(new PaginationResponseDto([], 0, 1, 10));
  });
});
