import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Roles } from '@/user/types/enums/roles.enum';
import { User } from '@/user/entities/user.entity';

@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const currentUser: User = request.user;
    const targetId: string = request.params?.id ?? request.body?.id;

    if (targetId !== currentUser.id && currentUser.rol !== Roles.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to access this user',
      );
    }

    return true;
  }
}
