import { instanceToPlain } from 'class-transformer';

import { Album } from './album.entity';

describe('Album', () => {
  const buildAlbum = (overrides: Partial<Album> = {}): Album =>
    Object.assign(new Album(), {
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      album: 'Random Access Memories',
      releaseDate: new Date('2013-05-17'),
      studio: 'Columbia',
      artist: 'Daft Punk',
      active: true,
      songs: [],
      ...overrides,
    });

  it('should be defined', () => {
    expect(buildAlbum()).toBeDefined();
  });

  it('should expose id, album, studio, artist and songs', () => {
    const plain = instanceToPlain(buildAlbum());

    expect(plain).toMatchObject({
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      album: 'Random Access Memories',
      studio: 'Columbia',
      artist: 'Daft Punk',
      songs: [],
    });
  });

  it('should exclude active', () => {
    const plain = instanceToPlain(buildAlbum());

    expect(plain).not.toHaveProperty('active');
  });

  it('should capitalize album before insert/update', () => {
    const album = buildAlbum({ album: 'random access memories' });

    (album as unknown as { normalize: () => void }).normalize();

    expect(album.album).toBe('Random Access Memories');
  });

  it('should capitalize artist before insert/update', () => {
    const album = buildAlbum({ artist: 'daft punk' });

    (album as unknown as { normalize: () => void }).normalize();

    expect(album.artist).toBe('Daft Punk');
  });

  it('should capitalize studio before insert/update', () => {
    const album = buildAlbum({ studio: 'columbia' });

    (album as unknown as { normalize: () => void }).normalize();

    expect(album.studio).toBe('Columbia');
  });
});
