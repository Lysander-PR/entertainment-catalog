export function buildStoragePath(folder: string, ...parts: string[]): string {
  const fileName = parts
    .map((part) => part.trim().replaceAll(' ', '-'))
    .join('-')
    .toLowerCase();

  return `${folder}/${fileName}`;
}
