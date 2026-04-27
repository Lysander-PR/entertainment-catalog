import {
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { DriverError } from '@/common/interfaces/filters/query-failed.filter.interface';

@Catch(QueryFailedError)
export class QueryFailedErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedErrorFilter.name);

  catch(exception: QueryFailedError): never {
    const driverError = exception.driverError as unknown as DriverError;
    this.logger.error(
      `Database error occurred: ${exception.message}`,
      exception.stack,
    );

    if (driverError.code.startsWith('23')) {
      this.integrityConstraintViolation(driverError);
    }

    if (driverError.code.startsWith('42')) {
      this.syntaxErrorOrAccessRuleViolation(
        driverError.code,
        exception.message,
      );
    }

    throw new InternalServerErrorException(
      'A database error occurred - check server logs for more details',
    );
  }

  private integrityConstraintViolation(driverError: DriverError): void {
    switch (driverError.code) {
      case '23000':
      case '23001':
      case '23503':
      case '23505':
      case '23P01':
        throw new ConflictException(driverError.detail);
      case '23002':
        throw new ForbiddenException(driverError.detail);
      case '23003':
      case '23514':
        throw new BadRequestException(driverError.detail);
      case '23502':
        throw new UnprocessableEntityException(driverError.detail);
      default:
        break;
    }
  }

  private syntaxErrorOrAccessRuleViolation(
    code: string,
    message: string,
  ): void {
    switch (code) {
      case '42601':
        throw new BadRequestException(`Syntax Error: ${message}`);
      case '42501':
        throw new ForbiddenException(`Access Rule Violation: ${message}`);
      case '42846':
        throw new BadRequestException(`Cannot Coerce: ${message}`);
      case '42804':
        throw new BadRequestException(`Datatype Mismatch: ${message}`);
      case '42P18':
        throw new BadRequestException(`Indeterminate Datatype: ${message}`);
      case '42803':
        throw new BadRequestException(`Grouping Error: ${message}`);
      case '42P20':
        throw new BadRequestException(`Windowing Error: ${message}`);
      case '42P19':
        throw new BadRequestException(`Invalid Recursion: ${message}`);
      case '42830':
        throw new BadRequestException(`Invalid Foreign Key: ${message}`);
      case '428C9':
        throw new BadRequestException(`Generated Always: ${message}`);
      case '42602':
        throw new BadRequestException(`Invalid Name: ${message}`);
      case '42622':
        throw new BadRequestException(`Name Too Long: ${message}`);
      case '42939':
        throw new BadRequestException(`Reserved Name: ${message}`);
      case '42P21':
        throw new BadRequestException(`Collation Mismatch: ${message}`);
      case '42P22':
        throw new BadRequestException(`Indeterminate Collation: ${message}`);
      case '42809':
        throw new BadRequestException(`Wrong Object Type: ${message}`);
      case '42703':
        throw new NotFoundException(`Undefined Column: ${message}`);
      case '42883':
        throw new NotFoundException(`Undefined Function: ${message}`);
      case '42P01':
        throw new NotFoundException(`Undefined Table: ${message}`);
      case '42P02':
        throw new NotFoundException(`Undefined Parameter: ${message}`);
      case '42704':
        throw new NotFoundException(`Undefined Object: ${message}`);
      case '42701':
        throw new ConflictException(`Duplicate Column: ${message}`);
      case '42P03':
        throw new ConflictException(`Duplicate Cursor: ${message}`);
      case '42P04':
        throw new ConflictException(`Duplicate Database: ${message}`);
      case '42723':
        throw new ConflictException(`Duplicate Function: ${message}`);
      case '42P05':
        throw new ConflictException(`Duplicate Prepared Statement: ${message}`);
      case '42P06':
        throw new ConflictException(`Duplicate Schema: ${message}`);
      case '42P07':
        throw new ConflictException(`Duplicate Table: ${message}`);
      case '42712':
        throw new ConflictException(`Duplicate Alias: ${message}`);
      case '42710':
        throw new ConflictException(`Duplicate Object: ${message}`);
      case '42702':
        throw new BadRequestException(`Ambiguous Column: ${message}`);
      case '42725':
        throw new BadRequestException(`Ambiguous Function: ${message}`);
      case '42P08':
        throw new BadRequestException(`Ambiguous Parameter: ${message}`);
      case '42P09':
        throw new BadRequestException(`Ambiguous Alias: ${message}`);
      case '42P10':
        throw new BadRequestException(`Invalid Column Reference: ${message}`);
      case '42611':
        throw new BadRequestException(`Invalid Column Definition: ${message}`);
      case '42P11':
        throw new BadRequestException(`Invalid Cursor Definition: ${message}`);
      case '42P12':
        throw new BadRequestException(
          `Invalid Database Definition: ${message}`,
        );
      case '42P13':
        throw new BadRequestException(
          `Invalid Function Definition: ${message}`,
        );
      case '42P14':
        throw new BadRequestException(
          `Invalid Prepared Statement Definition: ${message}`,
        );
      case '42P15':
        throw new BadRequestException(`Invalid Schema Definition: ${message}`);
      case '42P16':
        throw new BadRequestException(`Invalid Table Definition: ${message}`);
      case '42P17':
        throw new BadRequestException(`Invalid Object Definition: ${message}`);
    }
  }
}
