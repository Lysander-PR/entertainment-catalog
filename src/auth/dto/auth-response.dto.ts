import { ApiProperty } from '@nestjs/swagger';

import { User } from '@/user/entities/user.entity';

export class AuthResponseDto {
  @ApiProperty({ description: 'Authenticated user', type: User })
  user!: User;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;
}
