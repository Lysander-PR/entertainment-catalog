import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { User } from '@/user/entities/user.entity';
import { Roles } from '@/user/types/enums/roles.enum';
import { META_ROLES } from 'src/auth/types/consts/meta-roles.const';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  handleRequest<TUser = User>(
    err: any,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    const currentUser = user as unknown as User;
    const validRoles = this.reflector.get<Roles[]>(
      META_ROLES,
      context.getHandler(),
    );

    if (validRoles?.length && !validRoles.includes(currentUser.rol)) {
      throw new ForbiddenException(
        `User ${currentUser.username} needs a valid role: [${validRoles.join(', ')}]`,
      );
    }

    return user;
  }
}
