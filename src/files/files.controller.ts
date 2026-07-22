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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from '@/auth/decorator/auth.decorator';
import { Roles } from '@/user/types/enums/roles.enum';
import { Public } from '@/auth/decorator/public.decorator';

@ApiTags('Files')
@Controller('files')
@UseFilters(QueryFailedErrorFilter, StorageApiFilter)
@Auth(Roles.ADMIN)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file and create a cover record' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'File uploaded successfully', type: Cover })
  @ApiBadRequestResponse({
    description: 'Missing file, invalid mime type, or file too large',
  })
  @ApiUnauthorizedResponse({ description: 'Storage authentication failed' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions to access storage',
  })
  @ApiInternalServerErrorResponse({ description: 'Storage operation failed' })
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
  @ApiOperation({ summary: 'Delete a file by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'File id',
  })
  @ApiOkResponse({ description: 'File deleted successfully', type: Cover })
  @ApiNotFoundResponse({ description: 'File not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @ApiUnauthorizedResponse({ description: 'Storage authentication failed' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions to access storage',
  })
  @ApiInternalServerErrorResponse({ description: 'Storage operation failed' })
  @SerializeOptions({ type: Cover })
  @UseInterceptors(ClassSerializerInterceptor)
  async removeFile(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.remove(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file content by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'File id',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: 'Binary file stream',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiNotFoundResponse({ description: 'File not found' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @ApiUnauthorizedResponse({ description: 'Storage authentication failed' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions to access storage',
  })
  @ApiInternalServerErrorResponse({ description: 'Storage operation failed' })
  @Public()
  async getFile(@Param('id', ParseUUIDPipe) id: string) {
    const blob = await this.filesService.getFile(id);
    const buffer = Buffer.from(await blob.arrayBuffer());
    return new StreamableFile(buffer, {
      type: blob.type || 'application/octet-stream',
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Replace an existing file by id' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'File id',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'New file to upload',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'File updated successfully', type: Cover })
  @ApiNotFoundResponse({ description: 'File not found' })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format, invalid mime type, or file too large',
  })
  @ApiUnauthorizedResponse({ description: 'Storage authentication failed' })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions to access storage',
  })
  @ApiInternalServerErrorResponse({ description: 'Storage operation failed' })
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
