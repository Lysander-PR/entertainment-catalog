import { SetMetadata } from '@nestjs/common';

import { Public } from './public.decorator';
import { IS_PUBLIC_KEY } from '@/auth/types/consts/public-key.const';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(),
}));

describe('PublicDecorator', () => {
  it('should apply the public metadata', () => {
    Public();

    expect(SetMetadata).toHaveBeenCalled();
    expect(SetMetadata).toHaveBeenCalledWith(IS_PUBLIC_KEY, true);
  });
});
