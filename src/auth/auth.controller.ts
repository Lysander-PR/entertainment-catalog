import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-auth.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { Auth } from '@/auth/decorator/auth.decorator';
import { GetUser } from '@/auth/decorator/get-user.decorator';
import { User } from '@/user/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(QueryFailedErrorFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Credentials are not valid' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and log in' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiConflictResponse({
    description: 'The email or username already belongs to another user',
  })
  register(@Body() signInDto: CreateUserDto) {
    return this.authService.register(signInDto);
  }

  @Post('refresh')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renew the access token for the current user' })
  @ApiOkResponse({
    description: 'Token renewed successfully',
    type: AuthResponseDto,
  })
  refresh(@GetUser() user: User): AuthResponseDto {
    return this.authService.refreshToken(user);
  }
}
