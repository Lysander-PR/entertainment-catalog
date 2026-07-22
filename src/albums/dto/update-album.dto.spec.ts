import { validate } from 'class-validator';

import { UpdateAlbumDto } from './update-album.dto';

describe('UpdateAlbumDto', () => {
  it('should validate an empty dto has no errors', async () => {
    const dto = new UpdateAlbumDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should validate property album does not exceed max length when provided', async () => {
    const dto = new UpdateAlbumDto();
    dto.album = 'a'.repeat(101);

    const errors = await validate(dto);
    const albumError = errors.find((error) => error.property === 'album');

    expect(albumError).toBeDefined();
    expect(albumError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate property releaseDate is a valid date when provided', async () => {
    const dto = new UpdateAlbumDto();
    dto.releaseDate = 'invalid-date' as unknown as Date;

    const errors = await validate(dto);
    const releaseDateError = errors.find(
      (error) => error.property === 'releaseDate',
    );

    expect(releaseDateError).toBeDefined();
    expect(releaseDateError?.constraints).toHaveProperty('isDate');
  });

  it('should not include a songs property', () => {
    const dto = new UpdateAlbumDto();

    expect(dto).not.toHaveProperty('songs');
  });
});
