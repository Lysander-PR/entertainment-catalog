import { instanceToPlain } from 'class-transformer';

import { User } from './user.entity';
import { Roles } from '@/user/types/enums/roles.enum';

describe('User', () => {
  const buildUser = (overrides: Partial<User> = {}): User =>
    Object.assign(new User(), {
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      email: 'testuser@example.com',
      username: 'testuser',
      password: 'hashed-password',
      verified: false,
      rol: Roles.USER,
      active: true,
      ...overrides,
    });

  it('should be defined', () => {
    expect(buildUser()).toBeDefined();
  });

  it('should expose id, email, username and rol', () => {
    const plain = instanceToPlain(buildUser());

    expect(plain).toMatchObject({
      id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
      email: 'testuser@example.com',
      username: 'testuser',
      rol: Roles.USER,
    });
  });

  it('should exclude password, verified and active', () => {
    const plain = instanceToPlain(buildUser());

    expect(plain).not.toHaveProperty('password');
    expect(plain).not.toHaveProperty('verified');
    expect(plain).not.toHaveProperty('active');
  });

  it('should lowercase the email before insert/update', () => {
    const user = buildUser({ email: 'TestUser@Example.COM' });

    (user as unknown as { normalize: () => void }).normalize();

    expect(user.email).toBe('testuser@example.com');
  });
});
