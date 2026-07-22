import { JwtPayload } from './jwt-payload.interface';

describe('JwtPayload', () => {
  it('should be defined', () => {
    const payload: JwtPayload = {
      sub: '1',
      email: 'testuser@email.com',
    };

    expect(payload.sub).toBeDefined();
    expect(payload.email).toBeDefined();
  });
});
