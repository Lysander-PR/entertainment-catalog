import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '@/user/user.module';
import { envs } from '@/config/envs';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JWT_SECRET } from './types/consts/auth.const';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: JWT_SECRET, useValue: envs.JWT_SECRET },
  ],
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: envs.JWT_SECRET,
      signOptions: { expiresIn: '60s' },
    }),
  ],
})
export class AuthModule {}
