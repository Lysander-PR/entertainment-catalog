import { validate } from 'class-validator';

import { UpdateSongDto } from './update-song.dto';

describe('UpdateSongDto', () => {
  it('should validate an empty dto has no errors', async () => {
    const dto = new UpdateSongDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should validate property albumId is a valid uuid when provided', async () => {
    const dto = new UpdateSongDto();
    dto.albumId = 'not-a-uuid';

    const errors = await validate(dto);
    const albumIdError = errors.find((error) => error.property === 'albumId');

    expect(albumIdError).toBeDefined();
    expect(albumIdError?.constraints).toHaveProperty('isUuid');
  });

  it('should validate property genreId is a valid uuid when provided', async () => {
    const dto = new UpdateSongDto();
    dto.genreId = 'not-a-uuid';

    const errors = await validate(dto);
    const genreIdError = errors.find((error) => error.property === 'genreId');

    expect(genreIdError).toBeDefined();
    expect(genreIdError?.constraints).toHaveProperty('isUuid');
  });
});
