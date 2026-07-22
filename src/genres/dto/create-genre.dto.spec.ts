import { validate } from 'class-validator';

import { CreateGenreDto } from './create-genre.dto';

describe('CreateGenreDto', () => {
  const buildDto = (
    overrides: Partial<CreateGenreDto> = {},
  ): CreateGenreDto => {
    const dto = new CreateGenreDto();
    dto.description = 'Rock';
    return Object.assign(dto, overrides);
  };

  it('should validate property description is a string', async () => {
    const dto = buildDto();
    dto.description = 123 as unknown as string;

    const errors = await validate(dto);
    const descriptionError = errors.find(
      (error) => error.property === 'description',
    );

    expect(descriptionError).toBeDefined();
    expect(descriptionError?.constraints).toHaveProperty('isString');
  });

  it('should validate property description is not empty', async () => {
    const dto = buildDto({ description: '' });

    const errors = await validate(dto);
    const descriptionError = errors.find(
      (error) => error.property === 'description',
    );

    expect(descriptionError).toBeDefined();
    expect(descriptionError?.constraints).toHaveProperty('minLength');
  });

  it('should validate property description does not exceed max length', async () => {
    const dto = buildDto({ description: 'a'.repeat(51) });

    const errors = await validate(dto);
    const descriptionError = errors.find(
      (error) => error.property === 'description',
    );

    expect(descriptionError).toBeDefined();
    expect(descriptionError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate a fully valid dto has no errors', async () => {
    const dto = buildDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
