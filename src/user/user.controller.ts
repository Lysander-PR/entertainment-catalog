import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseFilters,
  ClassSerializerInterceptor,
  UseInterceptors,
  SerializeOptions,
  ParseUUIDPipe,
} from '@nestjs/common';

import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { UpdateValuesMissingErrorFilter } from '@/common/filters/update-values-missing.error.filter';

@Controller('user')
@UseFilters(QueryFailedErrorFilter, UpdateValuesMissingErrorFilter)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: User })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.softRemove(id);
  }

  @Post('reactivate')
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.userService.reactivate(id);
  }
}
