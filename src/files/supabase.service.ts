import { envs } from '@/config/envs';
import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageService } from '@/common/interfaces/storage.interface';

@Injectable()
export class SupabaseService implements IStorageService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor() {
    this.supabase = createClient(envs.SUPABASE_URL, envs.SUPABASE_KEY);
    this.bucketName = envs.SUPABASE_BUCKET;
  }

  async upload(file: Express.Multer.File, fileName: string): Promise<string> {
    const response = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    return this.unwrap(response).path;
  }

  async remove(path: string): Promise<void> {
    const response = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    this.unwrap(response);
  }

  async getFile(path: string): Promise<Blob> {
    const response = await this.supabase.storage
      .from(this.bucketName)
      .download(path);

    return this.unwrap(response);
  }

  private unwrap<T>(response: { data: T | null; error: Error | null }): T {
    if (response.error) throw response.error;
    return response.data!;
  }
}
