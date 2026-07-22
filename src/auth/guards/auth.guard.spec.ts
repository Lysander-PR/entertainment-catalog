import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './auth.guard';
import { Roles } from '@/user/types/enums/roles.enum';
import { User } from '@/user/entities/user.entity';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const createContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  const parentPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype) as {
    canActivate: (context: ExecutionContext) => boolean;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  describe('canActivate', () => {
    it('should allow the request without delegating to the parent guard when the route is public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const superCanActivate = jest
        .spyOn(parentPrototype, 'canActivate')
        .mockReturnValue(true);

      const result = guard.canActivate(createContext());

      expect(result).toBe(true);
      expect(superCanActivate).not.toHaveBeenCalled();
    });

    it('should delegate to the parent guard when the route is not public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const superCanActivate = jest
        .spyOn(parentPrototype, 'canActivate')
        .mockReturnValue(true);

      const context = createContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(superCanActivate).toHaveBeenCalled();
      expect(superCanActivate).toHaveBeenCalledWith(context);
    });
  });

  describe('handleRequest', () => {
    it('should throw the original error when one is provided', () => {
      const error = new Error('boom');
      const context = createContext();

      expect(() =>
        guard.handleRequest(error, null as unknown as User, null, context),
      ).toThrow(error);
    });

    it('should throw UnauthorizedException when there is no error and no user', () => {
      const context = createContext();

      expect(() =>
        guard.handleRequest(null, null as unknown as User, null, context),
      ).toThrow(UnauthorizedException);
    });

    it('should return the user when no roles are required for the route', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const user = { username: 'gabo1927', rol: Roles.USER } as User;
      const context = createContext();

      const result = guard.handleRequest(null, user, null, context);

      expect(result).toEqual(user);
    });

    it('should return the user when their role is included in the required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Roles.ADMIN, Roles.USER]);
      const user = { username: 'gabo1927', rol: Roles.USER } as User;
      const context = createContext();

      const result = guard.handleRequest(null, user, null, context);

      expect(result).toEqual(user);
    });

    it('should throw ForbiddenException when the user role is not among the required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Roles.ADMIN]);
      const user = { username: 'gabo1927', rol: Roles.USER } as User;
      const context = createContext();

      expect(() => guard.handleRequest(null, user, null, context)).toThrow(
        ForbiddenException,
      );
    });
  });
});
