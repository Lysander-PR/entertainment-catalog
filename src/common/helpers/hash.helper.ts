import * as bcrypt from 'bcrypt';

export function hashData(data: string): string {
  return bcrypt.hashSync(data, 5);
}

export function isMatchEncrypted(data: string, encrypted: string): boolean {
  return bcrypt.compareSync(data, encrypted);
}
