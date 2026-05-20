import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseFilters,
  SerializeOptions,
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { Song } from './entities/song.entity';
import { SongResponseWithoutRelationsDto } from './dto/song-response-without-relations.dto';
import { UpdateValuesMissingErrorFilter } from '@/common/filters/update-values-missing.error.filter';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SONGS_PATH } from './types/consts/songs.const';

@ApiTags('Songs')
@Controller(SONGS_PATH)
@UseFilters(QueryFailedErrorFilter, UpdateValuesMissingErrorFilter)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: Song })
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new song' })
  @ApiOkResponse({ description: 'Song created successfully', type: Song })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiConflictResponse({
    description:
      'Song title already exists in the same album or album does not exist',
  })
  create(@Body() createSongDto: CreateSongDto) {
    return this.songsService.create(createSongDto);
  }

  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate a previously soft-deleted song' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Song reactivated successfully', type: Song })
  @ApiNotFoundResponse({ description: 'Song not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.songsService.reactivate(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get active songs with pagination' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (starts at 1)',
  })
  @ApiOkResponse({
    description: 'List of active songs',
    type: Song,
    isArray: true,
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.songsService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one active song by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Song id',
  })
  @ApiOkResponse({ description: 'Song found', type: Song })
  @ApiNotFoundResponse({ description: 'Song not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.songsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing song' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Song id',
  })
  @ApiOkResponse({ description: 'Song updated successfully', type: Song })
  @ApiNotFoundResponse({ description: 'Song not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or empty update body',
  })
  @ApiConflictResponse({
    description: 'Song title already exists in the same album',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSongDto: UpdateSongDto,
  ) {
    return this.songsService.update(id, updateSongDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a song (set active=false)' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Song id',
  })
  @ApiOkResponse({
    description: 'Song soft deleted successfully',
    type: SongResponseWithoutRelationsDto,
  })
  @ApiNotFoundResponse({ description: 'Song not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @SerializeOptions({ type: SongResponseWithoutRelationsDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.songsService.remove(id);
  }
}
