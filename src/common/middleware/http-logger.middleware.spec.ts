/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';

import { HttpLoggerMiddleware } from './http-logger.middleware';

jest.spyOn(Logger.prototype, 'log').mockImplementation();

describe('HttpLoggerMiddleware', () => {
  let middleware: HttpLoggerMiddleware;

  beforeEach(() => {
    middleware = new HttpLoggerMiddleware();
  });

  it('should call next', () => {
    const req = { method: 'GET', originalUrl: '/books' } as Request;
    const res = { on: jest.fn(), statusCode: 200 } as unknown as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should log the request method, url and status code when the response finishes', () => {
    const req = { method: 'GET', originalUrl: '/books' } as Request;
    let finishCallback: () => void = () => {};
    const res = {
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') finishCallback = callback;
      }),
      statusCode: 200,
    } as unknown as Response;
    const next = jest.fn();

    middleware.use(req, res, next);
    finishCallback();

    expect(Logger.prototype.log).toHaveBeenCalledWith(
      expect.stringContaining('GET /books -> 200'),
    );
  });
});
