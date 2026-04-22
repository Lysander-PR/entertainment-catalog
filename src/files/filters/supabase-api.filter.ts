import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { StorageApiError } from '@supabase/supabase-js';

@Catch(StorageApiError)
export class SupabaseApiFilter implements ExceptionFilter {
  private readonly logger = new Logger(SupabaseApiFilter.name);

  catch(exception: StorageApiError, host: ArgumentsHost) {
    this.logger.debug(exception instanceof StorageApiError);
    throw exception;
  }
}
