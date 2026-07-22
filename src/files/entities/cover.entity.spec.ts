import { instanceToPlain } from 'class-transformer';

import { Cover } from './cover.entity';
import { Book } from '@/books/entities/book.entity';

describe('Cover', () => {
  const buildCover = (overrides: Partial<Cover> = {}): Cover =>
    Object.assign(new Cover(), {
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      file: 'covers/abc123-cover.jpg',
      createdAt: new Date('2026-01-01'),
      ...overrides,
    });

  it('should be defined', () => {
    expect(buildCover()).toBeDefined();
  });

  it('should expose id, file and createdAt', () => {
    const plain = instanceToPlain(buildCover());

    expect(plain).toMatchObject({
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      file: 'covers/abc123-cover.jpg',
    });
    expect(plain).toHaveProperty('createdAt');
  });

  it('should exclude the book relation', () => {
    const plain = instanceToPlain(buildCover({ book: new Book() }));

    expect(plain).not.toHaveProperty('book');
  });
});
