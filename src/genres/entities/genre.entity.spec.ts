import { Genre } from './genre.entity';

describe('Genre', () => {
  const buildGenre = (overrides: Partial<Genre> = {}): Genre =>
    Object.assign(new Genre(), {
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      genre: 'Rock',
      songs: [],
      ...overrides,
    });

  it('should be defined', () => {
    expect(buildGenre()).toBeDefined();
  });

  it('should capitalize the genre before insert/update', () => {
    const genre = buildGenre({ genre: 'rock' });

    (genre as unknown as { normalize: () => void }).normalize();

    expect(genre.genre).toBe('Rock');
  });
});
