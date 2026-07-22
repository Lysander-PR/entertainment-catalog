import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateAlbumDto } from './create-album.dto';

describe('CreateAlbumDto', () => {
  const buildDto = (overrides: Record<string, unknown> = {}): CreateAlbumDto =>
    plainToInstance(CreateAlbumDto, {
      album: 'Random Access Memories',
      studio: 'Columbia',
      releaseDate: new Date('2013-05-17'),
      artist: 'Daft Punk',
      songs: [
        {
          composer: 'Thomas Bangalter',
          title: 'Get Lucky',
          genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
        },
      ],
      ...overrides,
    });

  it('should validate property album is a string', async () => {
    const dto = buildDto({ album: 123 });

    const errors = await validate(dto);
    const albumError = errors.find((error) => error.property === 'album');

    expect(albumError).toBeDefined();
    expect(albumError?.constraints).toHaveProperty('isString');
  });

  it('should validate property album is not empty', async () => {
    const dto = buildDto({ album: '' });

    const errors = await validate(dto);
    const albumError = errors.find((error) => error.property === 'album');

    expect(albumError).toBeDefined();
    expect(albumError?.constraints).toHaveProperty('minLength');
  });

  it('should validate property album does not exceed max length', async () => {
    const dto = buildDto({ album: 'a'.repeat(101) });

    const errors = await validate(dto);
    const albumError = errors.find((error) => error.property === 'album');

    expect(albumError).toBeDefined();
    expect(albumError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate property studio does not exceed max length', async () => {
    const dto = buildDto({ studio: 'a'.repeat(21) });

    const errors = await validate(dto);
    const studioError = errors.find((error) => error.property === 'studio');

    expect(studioError).toBeDefined();
    expect(studioError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate property releaseDate is a valid date', async () => {
    const dto = buildDto({ releaseDate: 'invalid-date' });

    const errors = await validate(dto);
    const releaseDateError = errors.find(
      (error) => error.property === 'releaseDate',
    );

    expect(releaseDateError).toBeDefined();
    expect(releaseDateError?.constraints).toHaveProperty('isDate');
  });

  it('should validate property artist does not exceed max length', async () => {
    const dto = buildDto({ artist: 'a'.repeat(31) });

    const errors = await validate(dto);
    const artistError = errors.find((error) => error.property === 'artist');

    expect(artistError).toBeDefined();
    expect(artistError?.constraints).toHaveProperty('maxLength');
  });

  it('should validate property songs is an array', async () => {
    const dto = buildDto({ songs: undefined });

    const errors = await validate(dto);
    const songsError = errors.find((error) => error.property === 'songs');

    expect(songsError).toBeDefined();
    expect(songsError?.constraints).toHaveProperty('isArray');
  });

  it('should validate property songs has at least one item', async () => {
    const dto = buildDto({ songs: [] });

    const errors = await validate(dto);
    const songsError = errors.find((error) => error.property === 'songs');

    expect(songsError).toBeDefined();
    expect(songsError?.constraints).toHaveProperty('arrayMinSize');
  });

  it('should validate each song composer is required', async () => {
    const dto = buildDto({
      songs: [
        {
          title: 'Get Lucky',
          genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
        },
      ],
    });

    const errors = await validate(dto);
    const songsError = errors.find((error) => error.property === 'songs');
    const composerError = songsError?.children?.[0]?.children?.find(
      (error) => error.property === 'composer',
    );

    expect(composerError).toBeDefined();
    expect(composerError?.constraints).toHaveProperty('isString');
  });

  it('should validate each song genreId is a valid uuid', async () => {
    const dto = buildDto({
      songs: [
        {
          composer: 'Thomas Bangalter',
          title: 'Get Lucky',
          genreId: 'not-a-uuid',
        },
      ],
    });

    const errors = await validate(dto);
    const songsError = errors.find((error) => error.property === 'songs');
    const genreIdError = songsError?.children?.[0]?.children?.find(
      (error) => error.property === 'genreId',
    );

    expect(genreIdError).toBeDefined();
    expect(genreIdError?.constraints).toHaveProperty('isUuid');
  });

  it('should validate a fully valid dto has no errors', async () => {
    const dto = buildDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
