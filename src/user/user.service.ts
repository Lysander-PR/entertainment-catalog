import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserAlreadyExistsParams } from './types/interfaces/user-already-exists.interface';
import { hashData } from '@/common/helpers/hash.helper';
import { USER_PATH } from './types/consts/user.const';
import { CacheKey } from '@/common/abstracts/cache-key.abstract';
import { CacheService } from '@/common/cache/cache.service';
import { isUUID } from 'class-validator';

@Injectable()
export class UserService extends CacheKey {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
  ) {
    super(USER_PATH);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, username } = createUserDto;
    await this.userAlreadyExists({ email, username });

    const user = this.userRepository.create({
      email,
      username,
      password: hashData(password),
    });

    await this.cacheService.deleteByPrefix(this.cacheKey);
    return this.userRepository.save(user);
  }

  async findOne(id: string): Promise<User> {
    let user: User | null = null;

    if (isUUID(id)) {
      user = await this.userRepository.findOneBy({ id, active: true });
    } else {
      user = await this.userRepository.findOneBy({ email: id, active: true });
    }

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    await this.userAlreadyExists({
      id: user.id,
      email: updateUserDto.email,
      username: updateUserDto.username,
    });

    const userUpdated = this.userRepository.merge(user, updateUserDto);
    if (updateUserDto.password) {
      userUpdated.password = hashData(updateUserDto.password);
    }

    await this.userRepository.update({ id }, userUpdated);
    await this.cacheService.deleteByPrefix(this.cacheKey);
    return userUpdated;
  }

  async softRemove(id: string): Promise<User> {
    const user = await this.findOne(id);
    await this.userRepository.update({ id }, { active: false });
    await this.cacheService.deleteByPrefix(this.cacheKey);
    return user;
  }

  async reactivate(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} failed to reactivate`);
    }

    await this.userRepository.update({ id }, { active: true });
    await this.cacheService.deleteByPrefix(this.cacheKey);
    return user;
  }

  private async userAlreadyExists({
    id,
    email,
    username,
  }: UserAlreadyExistsParams): Promise<void> {
    if (email) {
      const existByEmail = await this.userRepository.exists({
        where: {
          id: id ? Not(id) : undefined,
          email: email.toLocaleLowerCase(),
        },
      });

      if (existByEmail) {
        throw new ConflictException(
          `The email ${email} belongs to another user`,
        );
      }
    }

    if (username) {
      const existByUsername = await this.userRepository.exists({
        where: {
          id: id ? Not(id) : undefined,
          username,
        },
      });

      if (existByUsername) {
        throw new ConflictException(
          `User with username ${username} already exists`,
        );
      }
    }
  }
}
