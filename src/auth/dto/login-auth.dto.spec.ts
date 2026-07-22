import { validate } from 'class-validator';
import { LoginDto } from './login-auth.dto';

describe('LoginAuthDto', () => {
  it('should validate property email is obligatory', async () => {
    const dto = new LoginDto();

    const errors = await validate(dto);
    const emailError = errors.find((error) => error.property === 'email');

    expect(emailError).toBeDefined();
    expect(emailError?.constraints).toHaveProperty('isNotEmpty');
    expect(emailError?.constraints?.isNotEmpty).toContain(
      'should not be empty',
    );
  });

  it('should validate property email has a valid format', async () => {
    const dto = new LoginDto();
    dto.email = 'invalid-email';

    const errors = await validate(dto);
    const emailError = errors.find((error) => error.property === 'email');

    expect(emailError).toBeDefined();
    expect(emailError?.constraints).toHaveProperty('isEmail');
    expect(emailError?.constraints?.isEmail).toContain('must be an email');
  });

  it('should validate property password is obligatory', async () => {
    const dto = new LoginDto();

    const errors = await validate(dto);
    const passwordError = errors.find((error) => error.property === 'password');

    expect(passwordError).toBeDefined();
    expect(passwordError?.constraints).toHaveProperty('isNotEmpty');
    expect(passwordError?.constraints?.isNotEmpty).toContain(
      'should not be empty',
    );
  });

  it('should validate property password is a string', async () => {
    const dto = new LoginDto();
    dto.password = 123 as any;

    const errors = await validate(dto);
    const passwordError = errors.find((error) => error.property === 'password');

    expect(passwordError).toBeDefined();
    expect(passwordError?.constraints).toHaveProperty('isString');
    expect(passwordError?.constraints?.isString).toContain('must be a string');
  });
});
