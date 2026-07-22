import { buildStoragePath } from './build-storage-path.helper';

describe('buildStoragePath', () => {
  it('should join the folder and the parts with a slash', () => {
    const result = buildStoragePath('books', 'gabriel', 'cien-anos');

    expect(result).toBe('books/gabriel-cien-anos');
  });

  it('should replace spaces with dashes', () => {
    const result = buildStoragePath('books', 'gabriel garcia');

    expect(result).toBe('books/gabriel-garcia');
  });

  it('should trim each part before joining', () => {
    const result = buildStoragePath('books', '  gabriel  ');

    expect(result).toBe('books/gabriel');
  });

  it('should lowercase the result', () => {
    const result = buildStoragePath('books', 'Gabriel Garcia');

    expect(result).toBe('books/gabriel-garcia');
  });

  it('should join multiple parts with a dash', () => {
    const result = buildStoragePath('movies', 'warner bros', 'dune');

    expect(result).toBe('movies/warner-bros-dune');
  });
});
