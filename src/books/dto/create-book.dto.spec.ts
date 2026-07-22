import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateBookDto } from './create-book.dto';

describe('CreateBookDto', () => {
  const buildDto = (overrides: Partial<CreateBookDto> = {}): CreateBookDto => {
    const dto = new CreateBookDto();
    dto.author = 'Gabriel Garcia Marquez';
    dto.title = 'Cien Anos De Soledad';
    dto.releaseDate = new Date('1967-05-30');
    dto.publisher = 'Sudamericana';
    return Object.assign(dto, overrides);
  };

  it('should validate property author is a string', async () => {
    const dto = buildDto();
    dto.author = 123 as unknown as string;

    const errors = await validate(dto);
    const authorError = errors.find((error) => error.property === 'author');

    expect(authorError).toBeDefined();
    expect(authorError?.constraints).toHaveProperty('isString');
  });

  it('should validate property author only contains letters and spaces', async () => {
    const dto = buildDto({ author: 'Gabriel3' });

    const errors = await validate(dto);
    const authorError = errors.find((error) => error.property === 'author');

    expect(authorError).toBeDefined();
    expect(authorError?.constraints).toHaveProperty('matches');
  });

  it('should validate property author is not empty', async () => {
    const dto = buildDto({ author: '' });

    const errors = await validate(dto);
    const authorError = errors.find((error) => error.property === 'author');

    expect(authorError).toBeDefined();
    expect(authorError?.constraints).toHaveProperty('minLength');
  });

  it('should validate property author does not exceed max length', async () => {
    const dto = buildDto({ author: 'a'.repeat(31) });

    const errors = await validate(dto);
    const authorError = errors.find((error) => error.property === 'author');

    expect(authorError).toBeDefined();
    expect(authorError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate property coWriter is optional', async () => {
    const dto = buildDto();

    const errors = await validate(dto);
    const coWriterError = errors.find(
      (error) => error.property === 'coWriter',
    );

    expect(coWriterError).toBeUndefined();
  });

  it('should validate property coWriter only contains letters and spaces', async () => {
    const dto = buildDto({ coWriter: 'Juan3' });

    const errors = await validate(dto);
    const coWriterError = errors.find(
      (error) => error.property === 'coWriter',
    );

    expect(coWriterError).toBeDefined();
    expect(coWriterError?.constraints).toHaveProperty('matches');
  });

  it('should validate property title is a string', async () => {
    const dto = buildDto();
    dto.title = 123 as unknown as string;

    const errors = await validate(dto);
    const titleError = errors.find((error) => error.property === 'title');

    expect(titleError).toBeDefined();
    expect(titleError?.constraints).toHaveProperty('isString');
  });

  it('should validate property title does not exceed max length', async () => {
    const dto = buildDto({ title: 'a'.repeat(51) });

    const errors = await validate(dto);
    const titleError = errors.find((error) => error.property === 'title');

    expect(titleError).toBeDefined();
    expect(titleError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate property releaseDate is a valid date', async () => {
    const dto = buildDto();
    dto.releaseDate = 'invalid-date' as unknown as Date;

    const errors = await validate(dto);
    const releaseDateError = errors.find(
      (error) => error.property === 'releaseDate',
    );

    expect(releaseDateError).toBeDefined();
    expect(releaseDateError?.constraints).toHaveProperty('isDate');
  });

  it('should transform a raw releaseDate string into a Date instance', () => {
    const dto = plainToInstance(CreateBookDto, {
      author: 'Gabriel Garcia Marquez',
      title: 'Cien Anos De Soledad',
      releaseDate: '1967-05-30',
      publisher: 'Sudamericana',
    });

    expect(dto.releaseDate).toBeInstanceOf(Date);
    expect(dto.releaseDate.toISOString()).toContain('1967-05-30');
  });

  it('should validate property releaseDate has no errors when transformed from a raw string', async () => {
    const dto = plainToInstance(CreateBookDto, {
      author: 'Gabriel Garcia Marquez',
      title: 'Cien Anos De Soledad',
      releaseDate: '1967-05-30',
      publisher: 'Sudamericana',
    });

    const errors = await validate(dto);
    const releaseDateError = errors.find(
      (error) => error.property === 'releaseDate',
    );

    expect(releaseDateError).toBeUndefined();
  });

  it('should validate property publisher is a string', async () => {
    const dto = buildDto();
    dto.publisher = 123 as unknown as string;

    const errors = await validate(dto);
    const publisherError = errors.find(
      (error) => error.property === 'publisher',
    );

    expect(publisherError).toBeDefined();
    expect(publisherError?.constraints).toHaveProperty('isString');
  });

  it('should validate property publisher does not exceed max length', async () => {
    const dto = buildDto({ publisher: 'a'.repeat(51) });

    const errors = await validate(dto);
    const publisherError = errors.find(
      (error) => error.property === 'publisher',
    );

    expect(publisherError).toBeDefined();
    expect(publisherError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate a fully valid dto has no errors', async () => {
    const dto = buildDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
