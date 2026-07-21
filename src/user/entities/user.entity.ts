import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

import { Roles } from '@/user/types/enums/roles.enum';

@Entity('user')
@Exclude()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id!: string;

  @Column('varchar', { name: 'email', length: 50, unique: true })
  @Expose()
  email!: string;

  @Column('varchar', { name: 'username', length: 30, unique: true })
  @Expose()
  username!: string;

  @Column('text', { name: 'password' })
  password!: string;

  @Column('boolean', { name: 'verified', default: false })
  verified!: boolean;

  @Column('enum', { name: 'rol', enum: Roles, default: Roles.USER })
  @Expose()
  rol!: Roles;

  @Column('boolean', { name: 'active', default: true })
  active!: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  private normalize() {
    if (this.email) this.email = this.email.toLocaleLowerCase();
  }
}
