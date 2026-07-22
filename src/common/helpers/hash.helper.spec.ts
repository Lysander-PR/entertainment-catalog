import { hashData, isMatchEncrypted } from './hash.helper';

describe('hashData', () => {
  it('should return a different string than the original data', () => {
    const hashed = hashData('Str0ng!Pass');

    expect(hashed).not.toBe('Str0ng!Pass');
  });
});

describe('isMatchEncrypted', () => {
  it('should return true when the data matches the hash', () => {
    const hashed = hashData('Str0ng!Pass');

    const result = isMatchEncrypted('Str0ng!Pass', hashed);

    expect(result).toBe(true);
  });

  it('should return false when the data does not match the hash', () => {
    const hashed = hashData('Str0ng!Pass');

    const result = isMatchEncrypted('wrong-password', hashed);

    expect(result).toBe(false);
  });
});
