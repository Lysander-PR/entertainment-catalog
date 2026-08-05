import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AlbumsService } from './albums.service';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { UpdateValuesMissingErrorFilter } from '@/common/filters/update-values-missing.error.filter';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { StorageApiFilter } from '@/files/filters/storage-api.filter';
import { Album } from './entities/album.entity';
import { FileValidationPipe } from '@/files/pipes/file-validation.pipe';
import { MimeTypes } from '@/files/types/enums/mime-types.enum';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ALBUMS_PATH } from './types/consts/albums.const';
import { Auth } from '@/auth/decorator/auth.decorator';
import { Public } from '@/auth/decorator/public.decorator';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { ApiPaginatedResponse } from '@/common/decorators/api-paginated-response.decorator';

@ApiTags('Albums')
@Controller(ALBUMS_PATH)
@UseFilters(
  QueryFailedErrorFilter,
  UpdateValuesMissingErrorFilter,
  StorageApiFilter,
)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: Album })
@Auth()
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new album with songs' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Album payload. The songs field must be a JSON string array in multipart requests.',
    schema: {
      type: 'object',
      required: ['album', 'studio', 'releaseDate', 'artist', 'songs'],
      properties: {
        album: { type: 'string', example: 'Random Access Memories' },
        studio: { type: 'string', example: 'Columbia' },
        releaseDate: {
          type: 'string',
          format: 'date',
          example: '2013-05-17',
        },
        artist: { type: 'string', example: 'Daft Punk' },
        songs: {
          type: 'string',
          description:
            'JSON array string. Example: [{"composer":"Thomas Bangalter","title":"Get Lucky","genreId":"f5822c99-2c57-48f6-bcc9-066ddb8b89d6"}]',
        },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Optional cover image (JPEG/PNG)',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Album created successfully', type: Album })
  @ApiBadRequestResponse({ description: 'Invalid payload or file format' })
  @ApiConflictResponse({
    description: 'Album with same name and artist already exists',
  })
  @UseInterceptors(FileInterceptor('cover'))
  create(
    @Body() createAlbumDto: CreateAlbumDto,
    @UploadedFile(
      new FileValidationPipe({
        allowedMimeTypes: [MimeTypes.JPEG, MimeTypes.PNG],
        required: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.albumsService.create(createAlbumDto, file);
  }

  @Post('reactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate a previously soft-deleted album' })
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
  @ApiOkResponse({ description: 'Album reactivated successfully', type: Album })
  @ApiNotFoundResponse({ description: 'Album not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.albumsService.reactivate(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get active albums with pagination' })
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
  @ApiPaginatedResponse(Album, 'Paginated list of active albums')
  @SerializeOptions({ type: PaginationResponseDto })
  @Public()
  find(@Query() paginationDto: PaginationDto) {
    return this.albumsService.find(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one active album by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Album id',
  })
  @ApiOkResponse({ description: 'Album found', type: Album })
  @ApiNotFoundResponse({ description: 'Album not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.albumsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing album' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Album id',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Partial album payload with optional cover image',
    schema: {
      type: 'object',
      properties: {
        album: { type: 'string', example: 'Random Access Memories' },
        studio: { type: 'string', example: 'Columbia' },
        releaseDate: {
          type: 'string',
          format: 'date',
          example: '2013-05-17',
        },
        artist: { type: 'string', example: 'Daft Punk' },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Optional cover image (JPEG/PNG)',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Album updated successfully', type: Album })
  @ApiNotFoundResponse({ description: 'Album not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format, empty update body or invalid file',
  })
  @ApiConflictResponse({
    description: 'Album with same name and artist already exists',
  })
  @UseInterceptors(FileInterceptor('cover'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAlbumDto: UpdateAlbumDto,
    @UploadedFile(
      new FileValidationPipe({
        allowedMimeTypes: [MimeTypes.JPEG, MimeTypes.PNG],
        required: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.albumsService.update(id, updateAlbumDto, file);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete an album (set active=false)' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Album id',
  })
  @ApiOkResponse({
    description: 'Album soft deleted successfully',
    type: Album,
  })
  @ApiNotFoundResponse({ description: 'Album not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.albumsService.remove(id);
  }
}
