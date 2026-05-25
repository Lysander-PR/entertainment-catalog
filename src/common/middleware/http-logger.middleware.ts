import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const started = Date.now();

    res.on('finish', () => {
      const ms = Date.now() - started;
      this.logger.log(
        `${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`,
      );
    });

    next();
  }
}
