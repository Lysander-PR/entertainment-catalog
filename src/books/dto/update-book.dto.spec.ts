import { validate } from 'class-validator';

import { UpdateBookDto } from './update-book.dto';

describe('UpdateBookDto', () => {
  it('should validate an empty dto has no errors', async () => {
    const dto = new UpdateBookDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should validate property author only contains letters and spaces when provided', async () => {
    const dto = new UpdateBookDto();
    dto.author = 'Gabriel3';

    const errors = await validate(dto);
    const authorError = errors.find((error) => error.property === 'author');

    expect(authorError).toBeDefined();
    expect(authorError?.constraints).toHaveProperty('matches');
  });

  it('should validate property releaseDate is a valid date when provided', async () => {
    const dto = new UpdateBookDto();
    dto.releaseDate = 'invalid-date' as unknown as Date;

    const errors = await validate(dto);
    const releaseDateError = errors.find(
      (error) => error.property === 'releaseDate',
    );

    expect(releaseDateError).toBeDefined();
    expect(releaseDateError?.constraints).toHaveProperty('isDate');
  });
});
