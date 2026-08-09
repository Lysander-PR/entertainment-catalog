import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { OwnershipGuard } from './ownership.guard';
import { Roles } from '@/user/types/enums/roles.enum';
import { User } from '@/user/entities/user.entity';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;

  const ownerId = 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23';
  const otherId = '11111111-1111-1111-1111-111111111111';

  const createContext = (request: {
    user: Partial<User>;
    params?: Record<string, string>;
    body?: Record<string, unknown>;
  }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new OwnershipGuard();
  });

  it('should allow the request when the id in the route params belongs to the current user', () => {
    const context = createContext({
      user: { id: ownerId, rol: Roles.USER },
      params: { id: ownerId },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow the request when the id in the body belongs to the current user', () => {
    const context = createContext({
      user: { id: ownerId, rol: Roles.USER },
      body: { id: ownerId },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow an admin to target another user', () => {
    const context = createContext({
      user: { id: ownerId, rol: Roles.ADMIN },
      params: { id: otherId },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject a non-admin user targeting another user', () => {
    const context = createContext({
      user: { id: ownerId, rol: Roles.USER },
      params: { id: otherId },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
