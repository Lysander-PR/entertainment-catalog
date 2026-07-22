import { capitalize } from './capitalize.helper';

describe('capitalize', () => {
  it('should capitalize the first letter of a single word', () => {
    const result = capitalize('rock');

    expect(result).toBe('Rock');
  });

  it('should lowercase the rest of the word', () => {
    const result = capitalize('ROCK');

    expect(result).toBe('Rock');
  });

  it('should capitalize each word in a sentence', () => {
    const result = capitalize('gabriel garcia marquez');

    expect(result).toBe('Gabriel Garcia Marquez');
  });
});
