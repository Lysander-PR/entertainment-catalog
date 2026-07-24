function randomLetters(length = 8): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return result;
}

export function uniqueWord(prefix: string): string {
  return `${prefix}${randomLetters(6)}`;
}
