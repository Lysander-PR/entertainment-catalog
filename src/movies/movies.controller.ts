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
} from '@nestjs/common';

import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Controller('movies')
@UseFilters(QueryFailedErrorFilter)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: Movie })
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(createMovieDto);
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
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.moviesService.update(id, updateMovieDto);
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
