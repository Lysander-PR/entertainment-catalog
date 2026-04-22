// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';
import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { FilesService } from './files.service';
import { SupabaseApiFilter } from './filters/supabase-api.filter';

@Controller('files')
// @UseInterceptors(ClassSerializerInterceptor)
@UseFilters(QueryFailedErrorFilter, SupabaseApiFilter)
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
  async getFile(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const blob = await this.filesService.getFile(id);
    const buffer = Buffer.from(await blob.arrayBuffer());
    res.setHeader('Content-Type', blob.type || 'application/octet-stream');
    res.end(buffer);
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
