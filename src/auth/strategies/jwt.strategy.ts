/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JWT_SECRET } from '@/auth/types/consts/auth.const';
import { JwtPayload } from '@/auth/types/interfaces/jwt-payload.interface';
import { UserService } from '@/user/user.service';
import { User } from '@/user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(JWT_SECRET) jwtSecret: string,
    private userService: UserService,
  ) {
    super({
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    try {
      return await this.userService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException('Token not valid');
    }
  }
}
