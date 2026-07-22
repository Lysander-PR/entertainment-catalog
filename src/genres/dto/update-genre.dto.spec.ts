import { validate } from 'class-validator';

import { UpdateGenreDto } from './update-genre.dto';

describe('UpdateGenreDto', () => {
  it('should validate an empty dto has no errors', async () => {
    const dto = new UpdateGenreDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should validate property description does not exceed max length when provided', async () => {
    const dto = new UpdateGenreDto();
    dto.description = 'a'.repeat(51);

    const errors = await validate(dto);
    const descriptionError = errors.find(
      (error) => error.property === 'description',
    );

    expect(descriptionError).toBeDefined();
    expect(descriptionError?.constraints).toHaveProperty('maxLength');
  });
});
