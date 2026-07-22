import { cleanInputString } from './clean-input-string.helper';

describe('cleanInputString', () => {
  it('should trim leading and trailing whitespace', () => {
    const result = cleanInputString('  Rock  ');

    expect(result).toBe('Rock');
  });

  it('should collapse multiple spaces into a single space', () => {
    const result = cleanInputString('Gabriel   Garcia');

    expect(result).toBe('Gabriel Garcia');
  });
});
