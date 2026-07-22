import { ValidationArguments } from 'class-validator';

import { onlyAlphaWithSpaces } from './messages-validator.helper';

describe('onlyAlphaWithSpaces', () => {
  it('should build a message with the property name and the invalid value', () => {
    const args = {
      property: 'author',
      value: 'Gabriel3',
    } as ValidationArguments;

    const result = onlyAlphaWithSpaces(args);

    expect(result).toBe(
      'author must contain only letters and spaces: Gabriel3',
    );
  });
});
