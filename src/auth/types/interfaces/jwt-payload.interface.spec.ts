import { JwtPayload } from './jwt-payload.interface';
import { generateUUID } from '@/common/helpers/generate-uuid.util';

describe('JwtPayload', () => {
  it('should be defined', () => {
    const payload: JwtPayload = {
      sub: '1',
      email: 'testuser@email.com',
      jti: generateUUID(),
    };

    expect(payload.sub).toBeDefined();
    expect(payload.email).toBeDefined();
    expect(payload.jti).toBeDefined();
  });
});
