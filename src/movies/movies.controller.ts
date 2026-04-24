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

@Controller('movies')
@UseFilters(QueryFailedErrorFilter, StorageApiFilter)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: Movie })
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  create(
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.moviesService.create(createMovieDto, file);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.moviesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.moviesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('cover'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.moviesService.update(id, updateMovieDto, file);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.moviesService.remove(id);
  }

  @Post('reactivate')
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.moviesService.reactivate(id);
  }
}
