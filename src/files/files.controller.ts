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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';

import { Cover } from './entities/cover.entity';

@Controller('files')
// @UseInterceptors(ClassSerializerInterceptor)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  // @SerializeOptions({ type: Cover })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.create(file);
  }

  @Delete(':id')
  // @SerializeOptions({ type: Cover })
  async removeFile(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.remove(id);
  }

  @Get(':id')
  // @SerializeOptions({ type: Blob })
  async getFile(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.getFile(id);
  }

  @Patch(':id')
  // @SerializeOptions({ type: Cover })
  @UseInterceptors(FileInterceptor('file'))
  async updateFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.filesService.update(id, file);
  }
}
