import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  NotContains,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(50)
  email!: string;

  @MinLength(1)
  @MaxLength(30)
  @NotContains(' ', { message: 'The username cannot contain spaces' })
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
  password!: string;
}
