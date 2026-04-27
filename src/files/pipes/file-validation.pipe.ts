import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { MimeTypes } from '@/files/types/enums/mime-types.enum';

export interface FileValidationOptions {
  maxSize?: number; // bytes
  allowedMimeTypes?: string[];
  required?: boolean;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly MAX_SIZE_MB_DEFAULT = 5;

  constructor(private readonly options: FileValidationOptions = {}) {
    this.options = {
      maxSize: options.maxSize || this.MAX_SIZE_MB_DEFAULT * 1024 * 1024,
      allowedMimeTypes: options.allowedMimeTypes || [
        MimeTypes.JPEG,
        MimeTypes.PNG,
        MimeTypes.WEBP,
        MimeTypes.GIF,
      ],
      required: options.required ?? true,
    };
  }

  transform(
    file: Express.Multer.File,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _metadata: ArgumentMetadata,
  ): Express.Multer.File | undefined {
    if (!file && this.options.required) {
      throw new BadRequestException('File is required');
    }

    if (!file && !this.options.required) {
      return undefined;
    }

    if (file.size > this.options.maxSize!) {
      const maxSizeMB = (this.options.maxSize! / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size exceeds the limit of ${maxSizeMB}MB`,
      );
    }

    if (!this.options.allowedMimeTypes!.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.options.allowedMimeTypes!.join(', ')}`,
      );
    }

    return file;
  }
}
