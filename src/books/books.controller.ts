import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseFilters,
  Query,
  SerializeOptions,
  UseInterceptors,
  ClassSerializerInterceptor,
  UploadedFile,
} from '@nestjs/common';

import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { UpdateValuesMissingErrorFilter } from '@/common/filters/update-values-missing.error.filter';
import { StorageApiFilter } from '@/files/filters/storage-api.filter';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@/files/pipes/file-validation.pipe';
import { MimeTypes } from '@/files/types/enums/mime-types.enum';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BOOKS_PATH } from './types/consts/books.const';

@ApiTags('Books')
@Controller(BOOKS_PATH)
@UseFilters(
  QueryFailedErrorFilter,
  UpdateValuesMissingErrorFilter,
  StorageApiFilter,
)
@SerializeOptions({ type: Book })
@UseInterceptors(ClassSerializerInterceptor)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new book' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Book payload with optional JPEG cover image',
    schema: {
      type: 'object',
      required: ['author', 'title', 'releaseDate', 'publisher'],
      properties: {
        author: { type: 'string', example: 'Gabriel García Márquez' },
        coWriter: { type: 'string', example: 'Juan Perez' },
        title: { type: 'string', example: 'Cien Anos De Soledad' },
        releaseDate: {
          type: 'string',
          format: 'date',
          example: '1967-05-30',
        },
        publisher: { type: 'string', example: 'Sudamericana' },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Optional JPEG image file',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Book created successfully',
    type: Book,
  })
  @ApiBadRequestResponse({ description: 'Invalid payload or file' })
  @ApiConflictResponse({
    description: 'A book with the same title and author already exists',
  })
  @UseInterceptors(FileInterceptor('cover'))
  create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile(
      new FileValidationPipe({
        allowedMimeTypes: [MimeTypes.JPEG],
        required: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.booksService.create(createBookDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get active books with pagination' })
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
    description: 'List of active books',
    type: Book,
    isArray: true,
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.booksService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one active book by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Book id',
  })
  @ApiOkResponse({ description: 'Book found', type: Book })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing book' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Book id',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Partial payload to update a book with optional JPEG cover',
    schema: {
      type: 'object',
      properties: {
        author: { type: 'string', example: 'Gabriel García Márquez' },
        coWriter: { type: 'string', example: 'Juan Perez' },
        title: { type: 'string', example: 'Cien Anos De Soledad' },
        releaseDate: {
          type: 'string',
          format: 'date',
          example: '1967-05-30',
        },
        publisher: { type: 'string', example: 'Sudamericana' },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Optional JPEG image file',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Book updated successfully', type: Book })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format, empty update body, or invalid file',
  })
  @ApiConflictResponse({
    description: 'A book with the same title and author already exists',
  })
  @UseInterceptors(FileInterceptor('cover'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile(
      new FileValidationPipe({
        allowedMimeTypes: [MimeTypes.JPEG],
        required: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.booksService.update(id, updateBookDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a book (set active=false)' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Book id',
  })
  @ApiOkResponse({ description: 'Book soft deleted', type: Book })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.booksService.remove(id);
  }

  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate a previously soft-deleted book' })
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
  @ApiOkResponse({ description: 'Book reactivated', type: Book })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.booksService.reactivate(id);
  }
}
