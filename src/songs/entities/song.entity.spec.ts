import { instanceToPlain } from 'class-transformer';

import { Song } from './song.entity';

describe('Song', () => {
  const buildSong = (overrides: Partial<Song> = {}): Song =>
    Object.assign(new Song(), {
      id: 'a1f6a9f1-4b56-4f84-89c4-8ebf9d18a744',
      composer: 'Thomas Bangalter',
      guestArtist: 'Daft Punk',
      title: 'Get Lucky',
      active: true,
      albumId: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      genreId: 'f5822c99-2c57-48f6-bcc9-066ddb8b89d6',
      ...overrides,
    });

  it('should be defined', () => {
    expect(buildSong()).toBeDefined();
  });

  it('should expose id, composer, guestArtist and title', () => {
    const plain = instanceToPlain(buildSong());

    expect(plain).toMatchObject({
      id: 'a1f6a9f1-4b56-4f84-89c4-8ebf9d18a744',
      composer: 'Thomas Bangalter',
      guestArtist: 'Daft Punk',
      title: 'Get Lucky',
    });
  });

  it('should exclude active', () => {
    const plain = instanceToPlain(buildSong());

    expect(plain).not.toHaveProperty('active');
  });

  it('should exclude albumId', () => {
    const plain = instanceToPlain(buildSong());

    expect(plain).not.toHaveProperty('albumId');
  });

  it('should exclude genreId', () => {
    const plain = instanceToPlain(buildSong());

    expect(plain).not.toHaveProperty('genreId');
  });

  it('should capitalize title before insert/update', () => {
    const song = buildSong({ title: 'get lucky' });

    (song as unknown as { normalize: () => void }).normalize();

    expect(song.title).toBe('Get Lucky');
  });

  it('should capitalize composer before insert/update', () => {
    const song = buildSong({ composer: 'thomas bangalter' });

    (song as unknown as { normalize: () => void }).normalize();

    expect(song.composer).toBe('Thomas Bangalter');
  });

  it('should capitalize guestArtist before insert/update', () => {
    const song = buildSong({ guestArtist: 'daft punk' });

    (song as unknown as { normalize: () => void }).normalize();

    expect(song.guestArtist).toBe('Daft Punk');
  });
});
