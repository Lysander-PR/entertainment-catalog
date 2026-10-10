import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateAlbumSongsDto } from './update-album-songs.dto';

describe('UpdateAlbumSongsDto', () => {
  const song = {
    composer: 'Thomas Bangalter',
    title: 'Get Lucky',
    genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
  };

  const buildDto = (
    overrides: Record<string, unknown> = {},
  ): UpdateAlbumSongsDto =>
    plainToInstance(UpdateAlbumSongsDto, {
      songs: [song],
      ...overrides,
    });

  it('should accept songs with and without id', async () => {
    const dto = buildDto({
      songs: [{ ...song, id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23' }, song],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should parse property songs when it comes as a JSON string', async () => {
    const dto = buildDto({ songs: JSON.stringify([song]) });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.songs).toHaveLength(1);
    expect(dto.songs[0].title).toBe(song.title);
  });

  it('should validate property songs is an array', async () => {
    const dto = buildDto({ songs: 1 });

    const errors = await validate(dto);
    const songsError = errors.find((error) => error.property === 'songs');

    expect(songsError).toBeDefined();
    expect(songsError?.constraints).toHaveProperty('isArray');
  });

  it('should validate property songs is not empty', async () => {
    const dto = buildDto({ songs: [] });

    const errors = await validate(dto);
    const songsError = errors.find((error) => error.property === 'songs');

    expect(songsError).toBeDefined();
    expect(songsError?.constraints).toHaveProperty('arrayMinSize');
  });

  it('should validate property id of a song is a uuid', async () => {
    const dto = buildDto({ songs: [{ ...song, id: 'not-a-uuid' }] });

    const errors = await validate(dto);
    const songsError = errors.find((error) => error.property === 'songs');

    expect(songsError).toBeDefined();
    expect(songsError?.children?.[0].children?.[0].constraints).toHaveProperty(
      'isUuid',
    );
  });

  it('should accept an optional partial album payload', async () => {
    const dto = buildDto({
      album: 'Random Access Memories',
      studio: 'Columbia',
      releaseDate: new Date('2013-05-17'),
      artist: 'Daft Punk',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should apply the album rules when property album is sent', async () => {
    const dto = buildDto({ album: 'a'.repeat(101) });

    const errors = await validate(dto);
    const albumError = errors.find((error) => error.property === 'album');

    expect(albumError).toBeDefined();
    expect(albumError?.constraints).toHaveProperty('maxLength');
  });

  it('should apply the album rules when property studio is sent', async () => {
    const dto = buildDto({ studio: 'a'.repeat(21) });

    const errors = await validate(dto);
    const studioError = errors.find((error) => error.property === 'studio');

    expect(studioError).toBeDefined();
    expect(studioError?.constraints).toHaveProperty('maxLength');
  });

  it('should apply the album rules when property releaseDate is sent', async () => {
    const dto = buildDto({ releaseDate: 'not-a-date' });

    const errors = await validate(dto);
    const releaseDateError = errors.find(
      (error) => error.property === 'releaseDate',
    );

    expect(releaseDateError).toBeDefined();
    expect(releaseDateError?.constraints).toHaveProperty('isDate');
  });

  it('should apply the album rules when property artist is sent', async () => {
    const dto = buildDto({ artist: '' });

    const errors = await validate(dto);
    const artistError = errors.find((error) => error.property === 'artist');

    expect(artistError).toBeDefined();
    expect(artistError?.constraints).toHaveProperty('minLength');
  });

  it('should validate nested songs require a title', async () => {
    const dto = buildDto({ songs: [{ ...song, title: undefined }] });

    const errors = await validate(dto);
    const songsError = errors.find((error) => error.property === 'songs');

    expect(songsError).toBeDefined();
    expect(
      songsError?.children?.[0].children?.some(
        (error) => error.property === 'title',
      ),
    ).toBe(true);
  });
});
