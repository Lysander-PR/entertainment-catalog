export function cleanInputString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
