import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { StorageApiError } from '@supabase/supabase-js';

@Catch(StorageApiError)
export class StorageApiFilter implements ExceptionFilter {
  private readonly logger = new Logger(StorageApiFilter.name);

  catch(exception: StorageApiError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(
      `Supabase Storage Error: ${exception.message}`,
      exception.stack,
    );

    const { statusCode, message } = this.mapSupabaseError(exception);

    response.status(statusCode).json({
      message,
      error: this.getErrorName(statusCode),
      statusCode,
    });
  }

  private mapSupabaseError(exception: StorageApiError): {
    statusCode: number;
    message: string;
  } {
    const errorMessage = exception.message.toLowerCase();

    if (errorMessage.includes('bucket') && errorMessage.includes('not found')) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Storage bucket not found',
      };
    }

    if (
      errorMessage.includes('not found') ||
      errorMessage.includes('does not exist') ||
      exception.statusCode === '404'
    ) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'File not found in storage',
      };
    }

    if (
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('invalid api key') ||
      exception.statusCode === '401'
    ) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Storage authentication failed',
      };
    }

    if (
      errorMessage.includes('forbidden') ||
      errorMessage.includes('permission denied') ||
      exception.statusCode === '403'
    ) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Insufficient permissions to access storage',
      };
    }

    if (
      errorMessage.includes('too large') ||
      errorMessage.includes('payload') ||
      exception.statusCode === '413'
    ) {
      return {
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: 'File size exceeds the allowed limit',
      };
    }

    if (
      errorMessage.includes('invalid') ||
      errorMessage.includes('bad request') ||
      exception.statusCode === '400'
    ) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message || 'Invalid storage request',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Storage operation failed',
    };
  }

  private getErrorName(statusCode: number): string {
    const errorNames: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };

    return errorNames[statusCode] || 'Error';
  }
}
