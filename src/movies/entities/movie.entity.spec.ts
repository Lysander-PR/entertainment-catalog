import { instanceToPlain } from 'class-transformer';

import { Movie } from './movie.entity';

describe('Movie', () => {
  const buildMovie = (overrides: Partial<Movie> = {}): Movie =>
    Object.assign(new Movie(), {
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      director: 'Denis Villeneuve',
      title: 'Dune',
      writer: 'Jon Spaihts',
      studio: 'Warner Bros',
      protagonist: 'Timothee Chalamet',
      releaseDate: new Date('2021-10-22'),
      active: true,
      createdAt: new Date('2026-01-01'),
      ...overrides,
    });

  it('should be defined', () => {
    expect(buildMovie()).toBeDefined();
  });

  it('should expose id, director, title, writer, studio, protagonist and createdAt', () => {
    const plain = instanceToPlain(buildMovie());

    expect(plain).toMatchObject({
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      director: 'Denis Villeneuve',
      title: 'Dune',
      writer: 'Jon Spaihts',
      studio: 'Warner Bros',
      protagonist: 'Timothee Chalamet',
    });
  });

  it('should exclude active', () => {
    const plain = instanceToPlain(buildMovie());

    expect(plain).not.toHaveProperty('active');
  });

  it('should capitalize director before insert/update', () => {
    const movie = buildMovie({ director: 'denis villeneuve' });

    (movie as unknown as { normalize: () => void }).normalize();

    expect(movie.director).toBe('Denis Villeneuve');
  });

  it('should capitalize title before insert/update', () => {
    const movie = buildMovie({ title: 'dune' });

    (movie as unknown as { normalize: () => void }).normalize();

    expect(movie.title).toBe('Dune');
  });

  it('should capitalize writer before insert/update', () => {
    const movie = buildMovie({ writer: 'jon spaihts' });

    (movie as unknown as { normalize: () => void }).normalize();

    expect(movie.writer).toBe('Jon Spaihts');
  });

  it('should capitalize studio before insert/update', () => {
    const movie = buildMovie({ studio: 'warner bros' });

    (movie as unknown as { normalize: () => void }).normalize();

    expect(movie.studio).toBe('Warner Bros');
  });

  it('should capitalize protagonist before insert/update', () => {
    const movie = buildMovie({ protagonist: 'timothee chalamet' });

    (movie as unknown as { normalize: () => void }).normalize();

    expect(movie.protagonist).toBe('Timothee Chalamet');
  });
});
