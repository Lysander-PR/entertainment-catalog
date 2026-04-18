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

@Controller('songs')
@UseFilters(QueryFailedErrorFilter)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: Song })
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  create(@Body() createSongDto: CreateSongDto) {
    return this.songsService.create(createSongDto);
  }

  @Post('reactivate')
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.songsService.reactivate(id);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.songsService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.songsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSongDto: UpdateSongDto,
  ) {
    return this.songsService.update(id, updateSongDto);
  }

  @Delete(':id')
  @SerializeOptions({ type: SongResponseWithoutRelationsDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.songsService.remove(id);
  }
}
