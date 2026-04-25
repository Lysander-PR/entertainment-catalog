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
  UploadedFile,
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { Song } from './entities/song.entity';
import { SongResponseWithoutRelationsDto } from './dto/song-response-without-relations.dto';
import { UpdateValuesMissingErrorFilter } from '@/common/filters/update-values-missing.error.filter';
import { StorageApiFilter } from '@/files/filters/storage-api.filter';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('songs')
@UseFilters(
  QueryFailedErrorFilter,
  UpdateValuesMissingErrorFilter,
  StorageApiFilter,
)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: Song })
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  create(
    @Body() createSongDto: CreateSongDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.songsService.create(createSongDto, file);
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
  @UseInterceptors(FileInterceptor('cover'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSongDto: UpdateSongDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.songsService.update(id, updateSongDto, file);
  }

  @Delete(':id')
  @SerializeOptions({ type: SongResponseWithoutRelationsDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.songsService.remove(id);
  }
}
