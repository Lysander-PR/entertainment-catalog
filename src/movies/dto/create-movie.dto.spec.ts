import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateMovieDto } from './create-movie.dto';

describe('CreateMovieDto', () => {
  const buildDto = (
    overrides: Partial<CreateMovieDto> = {},
  ): CreateMovieDto => {
    const dto = new CreateMovieDto();
    dto.director = 'Denis Villeneuve';
    dto.title = 'Dune';
    dto.writer = 'Jon Spaihts';
    dto.studio = 'Warner Bros';
    dto.protagonist = 'Timothee Chalamet';
    dto.releaseDate = new Date('2021-10-22');
    return Object.assign(dto, overrides);
  };

  it('should validate property director is a string', async () => {
    const dto = buildDto();
    dto.director = 123 as unknown as string;

    const errors = await validate(dto);
    const directorError = errors.find((error) => error.property === 'director');

    expect(directorError).toBeDefined();
    expect(directorError?.constraints).toHaveProperty('isString');
  });

  it('should validate property director only contains letters and spaces', async () => {
    const dto = buildDto({ director: 'Denis3' });

    const errors = await validate(dto);
    const directorError = errors.find((error) => error.property === 'director');

    expect(directorError).toBeDefined();
    expect(directorError?.constraints).toHaveProperty('matches');
  });

  it('should validate property director does not exceed max length', async () => {
    const dto = buildDto({ director: 'a'.repeat(31) });

    const errors = await validate(dto);
    const directorError = errors.find((error) => error.property === 'director');

    expect(directorError).toBeDefined();
    expect(directorError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate property title is a string', async () => {
    const dto = buildDto();
    dto.title = 123 as unknown as string;

    const errors = await validate(dto);
    const titleError = errors.find((error) => error.property === 'title');

    expect(titleError).toBeDefined();
    expect(titleError?.constraints).toHaveProperty('isString');
  });

  it('should validate property title is not empty', async () => {
    const dto = buildDto({ title: '' });

    const errors = await validate(dto);
    const titleError = errors.find((error) => error.property === 'title');

    expect(titleError).toBeDefined();
    expect(titleError?.constraints).toHaveProperty('minLength');
  });

  it('should validate property writer only contains letters and spaces', async () => {
    const dto = buildDto({ writer: 'Jon3' });

    const errors = await validate(dto);
    const writerError = errors.find((error) => error.property === 'writer');

    expect(writerError).toBeDefined();
    expect(writerError?.constraints).toHaveProperty('matches');
  });

  it('should validate property studio is a string', async () => {
    const dto = buildDto();
    dto.studio = 123 as unknown as string;

    const errors = await validate(dto);
    const studioError = errors.find((error) => error.property === 'studio');

    expect(studioError).toBeDefined();
    expect(studioError?.constraints).toHaveProperty('isString');
  });

  it('should validate property studio does not exceed max length', async () => {
    const dto = buildDto({ studio: 'a'.repeat(21) });

    const errors = await validate(dto);
    const studioError = errors.find((error) => error.property === 'studio');

    expect(studioError).toBeDefined();
    expect(studioError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate property protagonist only contains letters and spaces', async () => {
    const dto = buildDto({ protagonist: 'Timothee3' });

    const errors = await validate(dto);
    const protagonistError = errors.find(
      (error) => error.property === 'protagonist',
    );

    expect(protagonistError).toBeDefined();
    expect(protagonistError?.constraints).toHaveProperty('matches');
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
    const dto = plainToInstance(CreateMovieDto, {
      director: 'Denis Villeneuve',
      title: 'Dune',
      writer: 'Jon Spaihts',
      studio: 'Warner Bros',
      protagonist: 'Timothee Chalamet',
      releaseDate: '2021-10-22',
    });

    expect(dto.releaseDate).toBeInstanceOf(Date);
    expect(dto.releaseDate.toISOString()).toContain('2021-10-22');
  });

  it('should validate property releaseDate has no errors when transformed from a raw string', async () => {
    const dto = plainToInstance(CreateMovieDto, {
      director: 'Denis Villeneuve',
      title: 'Dune',
      writer: 'Jon Spaihts',
      studio: 'Warner Bros',
      protagonist: 'Timothee Chalamet',
      releaseDate: '2021-10-22',
    });

    const errors = await validate(dto);
    const releaseDateError = errors.find(
      (error) => error.property === 'releaseDate',
    );

    expect(releaseDateError).toBeUndefined();
  });

  it('should validate property soundtrack is optional', async () => {
    const dto = buildDto();

    const errors = await validate(dto);
    const soundtrackError = errors.find(
      (error) => error.property === 'soundtrack',
    );

    expect(soundtrackError).toBeUndefined();
  });

  it('should validate property soundtrack is a valid url when provided', async () => {
    const dto = buildDto({ soundtrack: 'not-a-url' });

    const errors = await validate(dto);
    const soundtrackError = errors.find(
      (error) => error.property === 'soundtrack',
    );

    expect(soundtrackError).toBeDefined();
    expect(soundtrackError?.constraints).toHaveProperty('isUrl');
  });

  it('should validate a fully valid dto has no errors', async () => {
    const dto = buildDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
