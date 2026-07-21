import * as bcrypt from 'bcrypt';

export function hashData(data: string): string {
  return bcrypt.hashSync(data, 5);
}
