import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { StorageApiError } from '@supabase/supabase-js';

import { StorageApiFilter } from './storage-api.filter';

describe('StorageApiFilter', () => {
  let filter: StorageApiFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    filter = new StorageApiFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });

    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should map a bucket-not-found error to 500 with a bucket-specific message', () => {
    const exception = new StorageApiError('Bucket not found', 500, '500');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      message: 'Storage bucket not found',
      error: 'Internal Server Error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });

  it('should map a not-found error to 404', () => {
    const exception = new StorageApiError('Object not found', 404, '404');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      message: 'File not found in storage',
      error: 'Not Found',
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it('should map an unauthorized error to 401', () => {
    const exception = new StorageApiError('Unauthorized access', 401, '401');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith({
      message: 'Storage authentication failed',
      error: 'Unauthorized',
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  });

  it('should map a forbidden error to 403', () => {
    const exception = new StorageApiError('Forbidden operation', 403, '403');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith({
      message: 'Insufficient permissions to access storage',
      error: 'Forbidden',
      statusCode: HttpStatus.FORBIDDEN,
    });
  });

  it('should map a payload-too-large error to 413', () => {
    const exception = new StorageApiError('Payload too large', 413, '413');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(json).toHaveBeenCalledWith({
      message: 'File size exceeds the allowed limit',
      error: 'Payload Too Large',
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
    });
  });

  it('should map an invalid-request error to 400 using the exception message', () => {
    const exception = new StorageApiError('Invalid bucket name', 400, '400');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      message: 'Invalid bucket name',
      error: 'Bad Request',
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('should map an unrecognized error to 500 with a generic message', () => {
    const exception = new StorageApiError('Something went wrong', 500, '500');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      message: 'Storage operation failed',
      error: 'Internal Server Error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  });
});
