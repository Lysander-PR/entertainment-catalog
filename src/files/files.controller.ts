// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';
import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  SerializeOptions,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { FileValidationPipe } from './pipes/file-validation.pipe';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { FilesService } from './files.service';
import { StorageApiFilter } from './filters/storage-api.filter';
import { ALLOWED_ALL_MIME_TYPES } from './types/enums/mime-types.enum';
import { Cover } from './entities/cover.entity';

@Controller('files')
@UseFilters(QueryFailedErrorFilter, StorageApiFilter)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @SerializeOptions({ type: Cover })
  @UseInterceptors(FileInterceptor('file'), ClassSerializerInterceptor)
  async uploadFile(
    @UploadedFile(
      new FileValidationPipe({ allowedMimeTypes: ALLOWED_ALL_MIME_TYPES }),
    )
    file: Express.Multer.File,
  ) {
    return this.filesService.create(file);
  }

  @Delete(':id')
  @SerializeOptions({ type: Cover })
  @UseInterceptors(ClassSerializerInterceptor)
  async removeFile(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.remove(id);
  }

  @Get(':id')
  async getFile(@Param('id', ParseUUIDPipe) id: string) {
    const blob = await this.filesService.getFile(id);
    const buffer = Buffer.from(await blob.arrayBuffer());
    return new StreamableFile(buffer, {
      type: blob.type || 'application/octet-stream',
    });
  }

  @Patch(':id')
  @SerializeOptions({ type: Cover })
  @UseInterceptors(FileInterceptor('file'), ClassSerializerInterceptor)
  async updateFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new FileValidationPipe({ allowedMimeTypes: ALLOWED_ALL_MIME_TYPES }),
    )
    file: Express.Multer.File,
  ) {
    return this.filesService.update(id, file);
  }
}
