/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';

import { UserService } from '@/user/user.service';
import { JwtStrategy } from './jwt.strategy';
import { JWT_SECRET } from '@/auth/types/consts/auth.const';
import { JwtPayload } from '@/auth/types/interfaces/jwt-payload.interface';
import { User } from '@/user/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { generateUUID } from '@/common/helpers/generate-uuid.util';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: UserService;

  beforeEach(async () => {
    const mockUserService = {
      findOne: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JWT_SECRET,
          useValue: 'test-secret',
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return a user if exists and is active', async () => {
    const payload: JwtPayload = {
      sub: '1',
      email: 'test@example.com',
      jti: generateUUID(),
    };
    const mockUser = { id: '1', email: 'test@example.com' } as User;

    jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);
    const result = await strategy.validate(payload);

    expect(result).toEqual(mockUser);
    expect(userService.findOne).toHaveBeenCalledWith(payload.sub);
  });

  it('should throw UnauthorizedException if user does not exist', async () => {
    const payload: JwtPayload = {
      sub: '1',
      email: 'test@example.com',
      jti: generateUUID(),
    };

    jest.spyOn(userService, 'findOne').mockRejectedValue(new Error());

    try {
      await strategy.validate(payload);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeInstanceOf(UnauthorizedException);
    }
  });
});
