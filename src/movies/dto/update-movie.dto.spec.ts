import { validate } from 'class-validator';

import { UpdateMovieDto } from './update-movie.dto';

describe('UpdateMovieDto', () => {
  it('should validate an empty dto has no errors', async () => {
    const dto = new UpdateMovieDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should validate property director only contains letters and spaces when provided', async () => {
    const dto = new UpdateMovieDto();
    dto.director = 'Denis3';

    const errors = await validate(dto);
    const directorError = errors.find((error) => error.property === 'director');

    expect(directorError).toBeDefined();
    expect(directorError?.constraints).toHaveProperty('matches');
  });

  it('should validate property soundtrack is a valid url when provided', async () => {
    const dto = new UpdateMovieDto();
    dto.soundtrack = 'not-a-url';

    const errors = await validate(dto);
    const soundtrackError = errors.find(
      (error) => error.property === 'soundtrack',
    );

    expect(soundtrackError).toBeDefined();
    expect(soundtrackError?.constraints).toHaveProperty('isUrl');
  });
});
