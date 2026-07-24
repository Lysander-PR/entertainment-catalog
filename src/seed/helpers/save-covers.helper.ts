import { Repository } from 'typeorm';

import { SeedWithCover } from '@/seed/types/interfaces/seed.interface';
import { Cover } from '@/files/entities/cover.entity';

export async function saveCovers<T extends SeedWithCover>(
  seed: T[],
  coverRepository: Repository<Cover>,
): Promise<Map<T, string>> {
  const seedWithCover = seed.filter((item) => !!item.coverPath);

  const covers = await coverRepository.save(
    seedWithCover.map((item) =>
      coverRepository.create({ file: item.coverPath }),
    ),
  );

  return new Map(
    seedWithCover.map((item, index): [T, string] => [item, covers[index].id]),
  );
}
