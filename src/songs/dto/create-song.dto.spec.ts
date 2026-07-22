import { validate } from 'class-validator';

import { CreateSongDto } from './create-song.dto';

describe('CreateSongDto', () => {
  const buildDto = (overrides: Partial<CreateSongDto> = {}): CreateSongDto => {
    const dto = new CreateSongDto();
    dto.composer = 'Thomas Bangalter';
    dto.title = 'Get Lucky';
    dto.albumId = 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23';
    dto.genreId = 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6';
    return Object.assign(dto, overrides);
  };

  it('should validate property composer is a string', async () => {
    const dto = buildDto();
    dto.composer = 123 as unknown as string;

    const errors = await validate(dto);
    const composerError = errors.find((error) => error.property === 'composer');

    expect(composerError).toBeDefined();
    expect(composerError?.constraints).toHaveProperty('isString');
  });

  it('should validate property composer is not empty', async () => {
    const dto = buildDto({ composer: '' });

    const errors = await validate(dto);
    const composerError = errors.find((error) => error.property === 'composer');

    expect(composerError).toBeDefined();
    expect(composerError?.constraints).toHaveProperty('minLength');
  });

  it('should validate property composer does not exceed max length', async () => {
    const dto = buildDto({ composer: 'a'.repeat(31) });

    const errors = await validate(dto);
    const composerError = errors.find((error) => error.property === 'composer');

    expect(composerError).toBeDefined();
    expect(composerError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate property guestArtist is optional', async () => {
    const dto = buildDto();

    const errors = await validate(dto);
    const guestArtistError = errors.find(
      (error) => error.property === 'guestArtist',
    );

    expect(guestArtistError).toBeUndefined();
  });

  it('should validate property guestArtist does not exceed max length when provided', async () => {
    const dto = buildDto({ guestArtist: 'a'.repeat(31) });

    const errors = await validate(dto);
    const guestArtistError = errors.find(
      (error) => error.property === 'guestArtist',
    );

    expect(guestArtistError).toBeDefined();
    expect(guestArtistError?.constraints).toHaveProperty('maxLength');
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

  it('should validate property albumId is a valid uuid', async () => {
    const dto = buildDto({ albumId: 'not-a-uuid' });

    const errors = await validate(dto);
    const albumIdError = errors.find((error) => error.property === 'albumId');

    expect(albumIdError).toBeDefined();
    expect(albumIdError?.constraints).toHaveProperty('isUuid');
  });

  it('should validate property genreId is a valid uuid', async () => {
    const dto = buildDto({ genreId: 'not-a-uuid' });

    const errors = await validate(dto);
    const genreIdError = errors.find((error) => error.property === 'genreId');

    expect(genreIdError).toBeDefined();
    expect(genreIdError?.constraints).toHaveProperty('isUuid');
  });

  it('should validate a fully valid dto has no errors', async () => {
    const dto = buildDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
