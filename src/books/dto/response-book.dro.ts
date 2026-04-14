import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseBookDto {
  @Expose()
  id: string;

  @Expose()
  author: string;

  @Expose()
  coWriter?: string;

  @Expose()
  title: string;

  @Expose()
  releaseDate: Date;

  active: boolean;

  @Expose()
  publisher: string;

  @Expose()
  createdAt: Date;
}
