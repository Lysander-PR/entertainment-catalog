import { BadRequestException, Logger } from '@nestjs/common';
import { UpdateValuesMissingError } from 'typeorm';

import { UpdateValuesMissingErrorFilter } from './update-values-missing.error.filter';

jest.spyOn(Logger.prototype, 'error').mockImplementation();

describe('UpdateValuesMissingErrorFilter', () => {
  let filter: UpdateValuesMissingErrorFilter;

  beforeEach(() => {
    filter = new UpdateValuesMissingErrorFilter();
  });

  it('should throw BadRequestException', () => {
    const exception = new UpdateValuesMissingError();

    expect(() => filter.catch(exception)).toThrow(BadRequestException);
  });

  it('should use a fixed message explaining that no values were provided', () => {
    const exception = new UpdateValuesMissingError();

    expect(() => filter.catch(exception)).toThrow(
      'No values provided for update - at least one field must be included in the request body',
    );
  });
});
