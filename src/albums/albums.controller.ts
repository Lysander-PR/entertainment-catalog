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

@Controller('albums')
@UseFilters(
  QueryFailedErrorFilter,
  UpdateValuesMissingErrorFilter,
  StorageApiFilter,
)
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: Album })
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
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
  reactivate(@Body('id', ParseUUIDPipe) id: string) {
    return this.albumsService.reactivate(id);
  }

  @Get()
  find(@Query() paginationDto: PaginationDto) {
    return this.albumsService.find(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.albumsService.findOne(id);
  }

  @Patch(':id')
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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.albumsService.remove(id);
  }
}
