import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

import { FileValidationPipe } from './file-validation.pipe';
import { MimeTypes } from '@/files/types/enums/mime-types.enum';

describe('FileValidationPipe', () => {
  const metadata = {} as ArgumentMetadata;

  const buildFile = (
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File =>
    ({
      originalname: 'cover.jpg',
      mimetype: MimeTypes.JPEG,
      size: 1024,
      buffer: Buffer.from('fake-image-data'),
      ...overrides,
    }) as Express.Multer.File;

  it('should throw BadRequestException if the file is required and missing', () => {
    const pipe = new FileValidationPipe({ required: true });

    expect(() =>
      pipe.transform(undefined as unknown as Express.Multer.File, metadata),
    ).toThrow(BadRequestException);
  });

  it('should return undefined if the file is not required and missing', () => {
    const pipe = new FileValidationPipe({ required: false });

    const result = pipe.transform(
      undefined as unknown as Express.Multer.File,
      metadata,
    );

    expect(result).toBeUndefined();
  });

  it('should throw BadRequestException if the file exceeds the max size', () => {
    const maxSize = 1024;
    const pipe = new FileValidationPipe({ maxSize });
    const file = buildFile({ size: maxSize + 1 });

    expect(() => pipe.transform(file, metadata)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException if the file mime type is not allowed', () => {
    const pipe = new FileValidationPipe({
      allowedMimeTypes: [MimeTypes.JPEG],
    });
    const file = buildFile({ mimetype: MimeTypes.PNG });

    expect(() => pipe.transform(file, metadata)).toThrow(BadRequestException);
  });

  it('should return the file when it is valid', () => {
    const pipe = new FileValidationPipe({
      allowedMimeTypes: [MimeTypes.JPEG],
    });
    const file = buildFile();

    const result = pipe.transform(file, metadata);

    expect(result).toBe(file);
  });

  it('should use a default max size of 5MB when not provided', () => {
    const pipe = new FileValidationPipe();
    const defaultMaxSizeBytes = 5 * 1024 * 1024;
    const file = buildFile({ size: defaultMaxSizeBytes + 1 });

    expect(() => pipe.transform(file, metadata)).toThrow(BadRequestException);
  });

  it('should use the default allowed mime types when not provided', () => {
    const pipe = new FileValidationPipe();
    const file = buildFile({ mimetype: MimeTypes.BMP });

    expect(() => pipe.transform(file, metadata)).toThrow(BadRequestException);
  });

  it('should default required to true when not provided', () => {
    const pipe = new FileValidationPipe();

    expect(() =>
      pipe.transform(undefined as unknown as Express.Multer.File, metadata),
    ).toThrow(BadRequestException);
  });
});
