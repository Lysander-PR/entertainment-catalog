import { createClient } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

jest.mock('@/config/envs', () => ({
  envs: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_KEY: 'test-key',
    SUPABASE_BUCKET: 'test-bucket',
  },
  isProd: false,
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let fromMock: jest.Mock;
  let uploadMock: jest.Mock;
  let removeMock: jest.Mock;
  let downloadMock: jest.Mock;

  const mockFile = {
    originalname: 'cover.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
  } as Express.Multer.File;

  beforeEach(() => {
    uploadMock = jest.fn();
    removeMock = jest.fn();
    downloadMock = jest.fn();
    fromMock = jest.fn().mockReturnValue({
      upload: uploadMock,
      remove: removeMock,
      download: downloadMock,
    });

    jest.mocked(createClient).mockReturnValue({
      storage: { from: fromMock },
    } as unknown as ReturnType<typeof createClient>);

    service = new SupabaseService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create the supabase client with the configured url and key', () => {
    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-key',
    );
  });

  it('should upload a file to the configured bucket and return its path', async () => {
    uploadMock.mockResolvedValue({
      data: { path: 'covers/cover.jpg' },
      error: null,
    });

    const result = await service.upload(mockFile, 'covers/cover.jpg');

    expect(fromMock).toHaveBeenCalledWith('test-bucket');
    expect(uploadMock).toHaveBeenCalledWith(
      'covers/cover.jpg',
      mockFile.buffer,
      { contentType: mockFile.mimetype, upsert: true },
    );
    expect(result).toBe('covers/cover.jpg');
  });

  it('should throw the underlying error if the upload fails', async () => {
    const error = new Error('upload failed');
    uploadMock.mockResolvedValue({ data: null, error });

    await expect(service.upload(mockFile, 'covers/cover.jpg')).rejects.toBe(
      error,
    );
  });

  it('should remove a file from the configured bucket', async () => {
    removeMock.mockResolvedValue({
      data: [{ name: 'covers/cover.jpg' }],
      error: null,
    });

    await service.remove('covers/cover.jpg');

    expect(fromMock).toHaveBeenCalledWith('test-bucket');
    expect(removeMock).toHaveBeenCalledWith(['covers/cover.jpg']);
  });

  it('should throw the underlying error if the removal fails', async () => {
    const error = new Error('remove failed');
    removeMock.mockResolvedValue({ data: null, error });

    await expect(service.remove('covers/cover.jpg')).rejects.toBe(error);
  });

  it('should download a file from the configured bucket', async () => {
    const blob = new Blob(['file-content']);
    downloadMock.mockResolvedValue({ data: blob, error: null });

    const result = await service.getFile('covers/cover.jpg');

    expect(fromMock).toHaveBeenCalledWith('test-bucket');
    expect(downloadMock).toHaveBeenCalledWith('covers/cover.jpg');
    expect(result).toBe(blob);
  });

  it('should throw the underlying error if the download fails', async () => {
    const error = new Error('download failed');
    downloadMock.mockResolvedValue({ data: null, error });

    await expect(service.getFile('covers/cover.jpg')).rejects.toBe(error);
  });
});
