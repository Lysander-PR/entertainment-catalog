import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { Roles } from '@/user/types/enums/roles.enum';
import { Auth } from './auth.decorator';
import { META_ROLES } from '@/auth/types/consts/meta-roles.const';
import { JwtAuthGuard } from '@/auth/guards/auth.guard';

jest.mock('@nestjs/common', () => ({
  applyDecorators: jest.fn(),
  UseGuards: jest.fn(),
  SetMetadata: jest.fn(),
}));

jest.mock('@/auth/guards/auth.guard', () => ({
  JwtAuthGuard: jest.fn(),
}));

describe('AuthDecorator', () => {
  it('should apply the JwtAuthGuard', () => {
    const roles: Roles[] = [Roles.ADMIN, Roles.USER];

    Auth(...roles);

    expect(applyDecorators).toHaveBeenCalled();
    expect(applyDecorators).toHaveBeenCalledWith(
      SetMetadata(META_ROLES, roles),
      UseGuards(JwtAuthGuard),
    );
  });
});
