import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

import { Roles } from '@/user/types/enums/roles.enum';

@Entity('user')
@Exclude()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    format: 'uuid',
  })
  id!: string;

  @Column('varchar', { name: 'email', length: 50, unique: true })
  @Expose()
  @ApiProperty({
    description: 'User email address',
    example: 'gabriel.garcia@example.com',
  })
  email!: string;

  @Column('varchar', { name: 'username', length: 30, unique: true })
  @Expose()
  @ApiProperty({
    description: 'Unique username',
    example: 'gabo1927',
  })
  username!: string;

  @Column('text', { name: 'password' })
  @ApiHideProperty()
  password!: string;

  @Column('boolean', { name: 'verified', default: false })
  @ApiHideProperty()
  verified!: boolean;

  @Column('enum', { name: 'rol', enum: Roles, default: Roles.USER })
  @Expose()
  @ApiProperty({
    description: 'User role',
    enum: Roles,
    example: Roles.USER,
  })
  rol!: Roles;

  @Column('boolean', { name: 'active', default: true })
  @ApiHideProperty()
  active!: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  private normalize() {
    if (this.email) this.email = this.email.toLocaleLowerCase();
  }
}
