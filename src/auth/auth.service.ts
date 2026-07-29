import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { LoginDto } from './dto/login-auth.dto';
import { UserService } from '@/user/user.service';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { isMatchEncrypted } from '@/common/helpers/hash.helper';
import { JwtPayload } from './types/interfaces/jwt-payload.interface';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '@/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: CreateUserDto): Promise<AuthResponseDto> {
    const user = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      username: registerDto.username,
    });

    return {
      user,
      access_token: this.generateJwtToken({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const user = await this.userService.findOne(loginDto.email);

      if (!isMatchEncrypted(loginDto.password, user.password)) {
        throw new Error();
      }

      return {
        user,
        access_token: this.generateJwtToken({
          sub: user.id,
          email: user.email,
        }),
      };
    } catch {
      throw new BadRequestException('Credentials are not valid');
    }
  }

  refreshToken(user: User): AuthResponseDto {
    return {
      user,
      access_token: this.generateJwtToken({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  private generateJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
