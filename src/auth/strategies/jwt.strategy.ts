import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { envs } from '@/config/envs';
import { JwtPayload } from 'src/auth/types/interfaces/jwt-payload.interface';
import { UserService } from '@/user/user.service';
import { User } from '@/user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      secretOrKey: envs.JWT_SECRET,
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    try {
      return this.userService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException('Token not valid');
    }
  }
}
