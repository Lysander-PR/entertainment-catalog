import { JWT_SECRET } from './auth.const';

describe('AuthConst', () => {
  it('should be defined', () => {
    expect(JWT_SECRET).toBeDefined();
  });
});
