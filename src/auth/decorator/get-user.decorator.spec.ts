/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';
import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { GetUser } from './get-user.decorator';
import { User } from '@/user/entities/user.entity';
import { Roles } from '@/user/types/enums/roles.enum';

function getParamDecoratorFactory(decorator: Function) {
  class TestDecorator {
    public test(@decorator() _value: unknown) {}
  }

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestDecorator, 'test');

  return args[Object.keys(args)[0]].factory;
}

describe('GetUserDecorator', () => {
  const mockUser: User = {
    id: '1',
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'hashed-password',
    verified: false,
    rol: Roles.USER,
    active: true,
  } as User;

  const createContext = (user?: User): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('should return the user from the request', () => {
    const factory = getParamDecoratorFactory(GetUser);

    const result = factory(null, createContext(mockUser));

    expect(result).toEqual(mockUser);
  });

  it('should throw InternalServerErrorException when there is no user in the request', () => {
    const factory = getParamDecoratorFactory(GetUser);

    expect(() => factory(null, createContext(undefined))).toThrow(
      InternalServerErrorException,
    );
  });
});
