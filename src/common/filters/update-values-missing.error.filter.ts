import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { UpdateValuesMissingError } from 'typeorm';

@Catch(UpdateValuesMissingError)
export class UpdateValuesMissingErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(UpdateValuesMissingErrorFilter.name);

  catch(exception: UpdateValuesMissingError): never {
    this.logger.error(
      `UpdateValuesMissingError occurred: ${exception.message}`,
      exception.stack,
    );

    throw new BadRequestException(
      'No values provided for update - at least one field must be included in the request body',
    );
  }
}
