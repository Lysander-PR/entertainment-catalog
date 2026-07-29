import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

import { User } from '@/user/entities/user.entity';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    const user: User | undefined = request.user;

    if (!user) {
      throw new InternalServerErrorException('User not found in the request');
    }

    return user;
  },
);
