import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { Roles } from '@/user/types/enums/roles.enum';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { META_ROLES } from 'src/auth/types/consts/meta-roles.const';

export function Auth(...roles: Roles[]) {
  return applyDecorators(
    SetMetadata(META_ROLES, roles),
    UseGuards(JwtAuthGuard),
  );
}
