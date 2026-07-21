import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  NotContains,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(50)
  @ApiProperty({
    description: 'User email address',
    example: 'gabriel.garcia@example.com',
    maxLength: 50,
    required: true,
  })
  email!: string;

  @MinLength(1)
  @MaxLength(30)
  @NotContains(' ', { message: 'The username cannot contain spaces' })
  @ApiProperty({
    description: 'Unique username, cannot contain spaces',
    example: 'gabo1927',
    minLength: 1,
    maxLength: 30,
    required: true,
  })
  username!: string;

  @IsNotEmpty()
  @IsString()
  @IsStrongPassword(
    {
      minLength: 6,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be stronger: 6+ chars with at least one upper, one lower, one number and one symbol',
    },
  )
  @ApiProperty({
    description:
      'Password with at least 6 characters, one uppercase letter, one number and one symbol',
    example: 'Str0ng!Pass',
    minLength: 6,
    required: true,
  })
  password!: string;
}
