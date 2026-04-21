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
import { SupabaseService } from './supabase.service';
import { FileInterceptor } from '@nestjs/platform-express';

import { Cover } from './entities/cover.entity';

@Controller('files')
// @UseInterceptors(ClassSerializerInterceptor)
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  // @SerializeOptions({ type: Cover })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const path = await this.supabaseService.upload(file);
    return this.filesService.create(path);
  }

  @Delete(':id')
  // @SerializeOptions({ type: Cover })
  async removeFile(@Param('id', ParseUUIDPipe) id: string) {
    const cover = await this.filesService.remove(id);
    await this.supabaseService.remove(cover.file);
  }

  @Get(':id')
  // @SerializeOptions({ type: Blob })
  async getFile(@Param('id', ParseUUIDPipe) id: string) {
    const cover = await this.filesService.findOne(id);
    return this.supabaseService.getFile(cover.file);
  }

  @Patch(':id')
  // @SerializeOptions({ type: Cover })
  @UseInterceptors(FileInterceptor('file'))
  async updateFile(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const path = await this.supabaseService.upload(file);
    return this.filesService.update(id, path);
  }
}
