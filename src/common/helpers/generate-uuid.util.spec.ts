import { generateUUID } from './generate-uuid.util';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateUUID', () => {
  it('should return a valid v4 UUID', () => {
    const uuid = generateUUID();

    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it('should return a different value on each call', () => {
    const first = generateUUID();
    const second = generateUUID();

    expect(first).not.toBe(second);
  });
});
