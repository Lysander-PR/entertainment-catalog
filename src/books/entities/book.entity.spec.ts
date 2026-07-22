import { instanceToPlain } from 'class-transformer';

import { Book } from './book.entity';

describe('Book', () => {
  const buildBook = (overrides: Partial<Book> = {}): Book =>
    Object.assign(new Book(), {
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      author: 'Gabriel Garcia Marquez',
      coWriter: 'Juan Perez',
      title: 'Cien Anos De Soledad',
      releaseDate: new Date('1967-05-30'),
      active: true,
      publisher: 'Sudamericana',
      createdAt: new Date('2026-01-01'),
      ...overrides,
    });

  it('should be defined', () => {
    expect(buildBook()).toBeDefined();
  });

  it('should expose id, author, coWriter, title, publisher and createdAt', () => {
    const plain = instanceToPlain(buildBook());

    expect(plain).toMatchObject({
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      author: 'Gabriel Garcia Marquez',
      coWriter: 'Juan Perez',
      title: 'Cien Anos De Soledad',
      publisher: 'Sudamericana',
    });
  });

  it('should exclude active', () => {
    const plain = instanceToPlain(buildBook());

    expect(plain).not.toHaveProperty('active');
  });

  it('should capitalize author before insert/update', () => {
    const book = buildBook({ author: 'gabriel garcia marquez' });

    (book as unknown as { normalize: () => void }).normalize();

    expect(book.author).toBe('Gabriel Garcia Marquez');
  });

  it('should capitalize title before insert/update', () => {
    const book = buildBook({ title: 'cien anos de soledad' });

    (book as unknown as { normalize: () => void }).normalize();

    expect(book.title).toBe('Cien Anos De Soledad');
  });

  it('should capitalize publisher before insert/update', () => {
    const book = buildBook({ publisher: 'sudamericana' });

    (book as unknown as { normalize: () => void }).normalize();

    expect(book.publisher).toBe('Sudamericana');
  });

  it('should capitalize coWriter before insert/update', () => {
    const book = buildBook({ coWriter: 'juan perez' });

    (book as unknown as { normalize: () => void }).normalize();

    expect(book.coWriter).toBe('Juan Perez');
  });
});
