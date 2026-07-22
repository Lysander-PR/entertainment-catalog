import { User } from '@/user/entities/user.entity';
import { AuthResponseDto } from './auth-response.dto';

describe('AuthResponseDto', () => {
  it('should validate property user is an instance of User', () => {
    const user = new User();
    const dto = new AuthResponseDto();
    dto.user = user;

    expect(dto.user).toBeInstanceOf(User);
  });

  it('should validate property access_token', () => {
    const dto = new AuthResponseDto();
    dto.access_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    expect(dto.access_token).toBeDefined();
  });
});
