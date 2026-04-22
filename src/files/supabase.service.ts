import { envs } from '@/config/envs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

  get client() {
    return this.supabase;
  }

  async upload(file: Express.Multer.File, fileName: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw this.handleError(error);
    }

    return data.path;
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw this.handleError(error);
    }
  }

  async getFile(path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(path);

    if (error) {
      throw this.handleError(error);
    }

    return data;
  }

  private handleError(error: Error) {
    this.logger.error(error.stack);
    return new BadRequestException(error.name);
  }
}
