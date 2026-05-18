import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseFilters,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
  UploadedFile,
} from '@nestjs/common';

import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageApiFilter } from '@/files/filters/storage-api.filter';
import { UpdateValuesMissingErrorFilter } from '@/common/filters/update-values-missing.error.filter';
import { FileValidationPipe } from '@/files/pipes/file-validation.pipe';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Movies')
@Controller('movies')
@UseFilters(
  QueryFailedErrorFilter,
  UpdateValuesMissingErrorFilter,
  StorageApiFilter,
)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: Movie })
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Movie payload with optional cover image',
    schema: {
      type: 'object',
      required: [
        'director',
        'title',
        'writer',
        'studio',
        'protagonist',
        'releaseDate',
      ],
      properties: {
        director: { type: 'string', example: 'Denis Villeneuve' },
        title: { type: 'string', example: 'Dune' },
        writer: { type: 'string', example: 'Jon Spaihts' },
        studio: { type: 'string', example: 'Warner Bros' },
        protagonist: { type: 'string', example: 'Timothee Chalamet' },
        releaseDate: {
          type: 'string',
          format: 'date',
          example: '2021-10-22',
        },
        soundtrack: {
          type: 'string',
          format: 'uri',
          example: 'https://open.spotify.com/track/example',
        },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Optional image file',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Movie created successfully',
    type: Movie,
  })
  @ApiBadRequestResponse({ description: 'Invalid payload or file' })
  @ApiConflictResponse({
    description:
      'A movie with the same title, director and studio already exists',
  })
  @UseInterceptors(FileInterceptor('cover'))
  create(
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFile(new FileValidationPipe({ required: false }))
    file?: Express.Multer.File,
  ) {
    return this.moviesService.create(createMovieDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get active movies with pagination' })
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
    description: 'List of active movies',
    type: Movie,
    isArray: true,
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.moviesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one active movie by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Movie id',
  })
  @ApiOkResponse({ description: 'Movie found', type: Movie })
  @ApiNotFoundResponse({ description: 'Movie not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.moviesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing movie' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Movie id',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Partial payload to update a movie with optional cover image',
    schema: {
      type: 'object',
      properties: {
        director: { type: 'string', example: 'Denis Villeneuve' },
        title: { type: 'string', example: 'Dune' },
        writer: { type: 'string', example: 'Jon Spaihts' },
        studio: { type: 'string', example: 'Warner Bros' },
        protagonist: { type: 'string', example: 'Timothee Chalamet' },
        releaseDate: {
          type: 'string',
          format: 'date',
          example: '2021-10-22',
        },
        soundtrack: {
          type: 'string',
          format: 'uri',
          example: 'https://open.spotify.com/track/example',
        },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Optional image file',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Movie updated successfully', type: Movie })
  @ApiNotFoundResponse({ description: 'Movie not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format, empty update body, or invalid file',
  })
  @ApiConflictResponse({
    description:
      'A movie with the same title, director and studio already exists',
  })
  @UseInterceptors(FileInterceptor('cover'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
    @UploadedFile(new FileValidationPipe({ required: false }))
    file?: Express.Multer.File,
  ) {
    return this.moviesService.update(id, updateMovieDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a movie (set active=false)' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Movie id',
  })
  @ApiOkResponse({ description: 'Movie soft deleted', type: Movie })
  @ApiNotFoundResponse({ description: 'Movie not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.moviesService.remove(id);
  }

  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate a previously soft-deleted movie' })
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
  @ApiOkResponse({ description: 'Movie reactivated', type: Movie })
  @ApiNotFoundResponse({ description: 'Movie not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.moviesService.reactivate(id);
  }
}
