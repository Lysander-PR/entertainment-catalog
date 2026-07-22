import { SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '@/auth/types/consts/public-key.const';

export function Public() {
  return SetMetadata(IS_PUBLIC_KEY, true);
}
