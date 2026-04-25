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

@Controller('books')
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
  @UseInterceptors(FileInterceptor('cover'))
  create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.booksService.create(createBookDto, file);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.booksService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('cover'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.booksService.update(id, updateBookDto, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.booksService.remove(id);
  }

  @Post('reactivate')
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.booksService.reactivate(id);
  }
}
