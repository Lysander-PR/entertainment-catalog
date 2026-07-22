import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { QueryFailedErrorFilter } from './query-failed.filter';

jest.spyOn(Logger.prototype, 'error').mockImplementation();

describe('QueryFailedErrorFilter', () => {
  let filter: QueryFailedErrorFilter;

  const buildException = (
    code: string,
    detail = 'detail',
  ): QueryFailedError => {
    const driverError = {
      code,
      detail,
      toString: () => 'driver error message',
    };

    return new QueryFailedError(
      'SELECT 1',
      [],
      driverError as unknown as Error,
    );
  };

  beforeEach(() => {
    filter = new QueryFailedErrorFilter();
  });

  describe('data exception codes (22xxx)', () => {
    it.each([
      ['22001', BadRequestException],
      ['22003', BadRequestException],
      ['22007', BadRequestException],
    ])('should throw %s for code %s', (code, ExceptionClass) => {
      const exception = buildException(code);

      expect(() => filter.catch(exception)).toThrow(ExceptionClass);
    });

    it('should throw InternalServerErrorException for an unmatched 22xxx code', () => {
      const exception = buildException('22999');

      expect(() => filter.catch(exception)).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('integrity constraint violation codes (23xxx)', () => {
    it.each([
      ['23000', ConflictException],
      ['23001', ConflictException],
      ['23503', ConflictException],
      ['23505', ConflictException],
      ['23P01', ConflictException],
      ['23002', ForbiddenException],
      ['23003', BadRequestException],
      ['23514', BadRequestException],
      ['23502', UnprocessableEntityException],
    ])('should throw %s for code %s', (code, ExceptionClass) => {
      const exception = buildException(code);

      expect(() => filter.catch(exception)).toThrow(ExceptionClass);
    });

    it('should use the driver error detail as the message', () => {
      const exception = buildException('23505', 'Key already exists');

      expect(() => filter.catch(exception)).toThrow('Key already exists');
    });

    it('should throw InternalServerErrorException for an unmatched 23xxx code', () => {
      const exception = buildException('23999');

      expect(() => filter.catch(exception)).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('syntax error or access rule violation codes (42xxx)', () => {
    it.each([
      ['42601', BadRequestException],
      ['42846', BadRequestException],
      ['42804', BadRequestException],
      ['42P18', BadRequestException],
      ['42803', BadRequestException],
      ['42P20', BadRequestException],
      ['42P19', BadRequestException],
      ['42830', BadRequestException],
      ['428C9', BadRequestException],
      ['42602', BadRequestException],
      ['42622', BadRequestException],
      ['42939', BadRequestException],
      ['42P21', BadRequestException],
      ['42P22', BadRequestException],
      ['42809', BadRequestException],
      ['42702', BadRequestException],
      ['42725', BadRequestException],
      ['42P08', BadRequestException],
      ['42P09', BadRequestException],
      ['42P10', BadRequestException],
      ['42611', BadRequestException],
      ['42P11', BadRequestException],
      ['42P12', BadRequestException],
      ['42P13', BadRequestException],
      ['42P14', BadRequestException],
      ['42P15', BadRequestException],
      ['42P16', BadRequestException],
      ['42P17', BadRequestException],
      ['42501', ForbiddenException],
      ['42703', NotFoundException],
      ['42883', NotFoundException],
      ['42P01', NotFoundException],
      ['42P02', NotFoundException],
      ['42704', NotFoundException],
      ['42701', ConflictException],
      ['42P03', ConflictException],
      ['42P04', ConflictException],
      ['42723', ConflictException],
      ['42P05', ConflictException],
      ['42P06', ConflictException],
      ['42P07', ConflictException],
      ['42712', ConflictException],
      ['42710', ConflictException],
    ])('should throw %s for code %s', (code, ExceptionClass) => {
      const exception = buildException(code);

      expect(() => filter.catch(exception)).toThrow(ExceptionClass);
    });

    it('should throw InternalServerErrorException for an unmatched 42xxx code', () => {
      const exception = buildException('42999');

      expect(() => filter.catch(exception)).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('unrecognized code prefix', () => {
    it('should throw InternalServerErrorException for an unrecognized code prefix', () => {
      const exception = buildException('08000');

      expect(() => filter.catch(exception)).toThrow(
        InternalServerErrorException,
      );
    });

    it('should use a generic message when the code prefix is not recognized', () => {
      const exception = buildException('08000');

      expect(() => filter.catch(exception)).toThrow(
        'A database error occurred - check server logs for more details',
      );
    });
  });
});
