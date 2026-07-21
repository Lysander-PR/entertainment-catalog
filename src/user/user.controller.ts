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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { UpdateValuesMissingErrorFilter } from '@/common/filters/update-values-missing.error.filter';
import { USER_PATH } from './types/consts/user.const';

@ApiTags('User')
@Controller(USER_PATH)
@UseFilters(QueryFailedErrorFilter, UpdateValuesMissingErrorFilter)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: User })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created successfully', type: User })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiConflictResponse({
    description: 'The email or username already belongs to another user',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one active user by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'User id',
  })
  @ApiOkResponse({ description: 'User found', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'User id',
  })
  @ApiOkResponse({ description: 'User updated successfully', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or empty update body',
  })
  @ApiConflictResponse({
    description: 'The email or username already belongs to another user',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user (set active=false)' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'User id',
  })
  @ApiOkResponse({ description: 'User soft deleted', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.softRemove(id);
  }

  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate a previously soft-deleted user' })
  @ApiOkResponse({ description: 'User reactivated', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.userService.reactivate(id);
  }
}
