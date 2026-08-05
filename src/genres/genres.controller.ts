import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';

import { GenresService } from './genres.service';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { UpdateValuesMissingErrorFilter } from '@/common/filters/update-values-missing.error.filter';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Genre } from './entities/genre.entity';
import { GENRES_PATH } from './types/consts/genres.const';
import { Auth } from '@/auth/decorator/auth.decorator';
import { Public } from '@/auth/decorator/public.decorator';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';

@ApiTags('Genres')
@Controller(GENRES_PATH)
@UseFilters(QueryFailedErrorFilter, UpdateValuesMissingErrorFilter)
@Auth()
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new genre' })
  @ApiOkResponse({ description: 'Genre created successfully', type: Genre })
  @ApiBadRequestResponse({ description: 'Invalid payload' })
  @ApiConflictResponse({ description: 'Genre already exists' })
  create(@Body() createGenreDto: CreateGenreDto) {
    return this.genresService.create(createGenreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get genres with pagination' })
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
  @ApiPaginatedResponse(Genre, 'Paginated list of genres')
  @Public()
  find(@Query() paginationDto: PaginationDto) {
    return this.genresService.find(paginationDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get every genre without pagination' })
  @ApiOkResponse({
    description: 'Full list of genres',
    type: Genre,
    isArray: true,
  })
  @Public()
  findAll() {
    return this.genresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one genre by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Genre id',
  })
  @ApiOkResponse({ description: 'Genre found', type: Genre })
  @ApiNotFoundResponse({ description: 'Genre not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.genresService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing genre' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Genre id',
  })
  @ApiOkResponse({ description: 'Genre updated successfully', type: Genre })
  @ApiNotFoundResponse({ description: 'Genre not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format or empty update body',
  })
  @ApiConflictResponse({ description: 'Genre already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    return this.genresService.update(id, updateGenreDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a genre by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Genre id',
  })
  @ApiOkResponse({ description: 'Genre deleted successfully', type: Genre })
  @ApiNotFoundResponse({ description: 'Genre not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.genresService.remove(id);
  }
}
