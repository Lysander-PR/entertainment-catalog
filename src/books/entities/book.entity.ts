import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Cover } from '@/files/entities/cover.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

@Entity('books')
@Exclude()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  @ApiProperty({
    description: 'Unique identifier of the book',
    example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    format: 'uuid',
  })
  id: string;

  @Column('varchar', { name: 'author', length: 30 })
  @Expose()
  @ApiProperty({
    description: 'Main author name',
    example: 'Gabriel García Márquez',
  })
  author: string;

  @Column('varchar', { name: 'co_writer', length: 30, nullable: true })
  @Expose()
  @ApiPropertyOptional({
    description: 'Co-writer name',
    example: 'Juan Perez',
  })
  coWriter?: string;

  @Column('varchar', { name: 'title', length: 50 })
  @Expose()
  @ApiProperty({
    description: 'Book title',
    example: 'Cien Anos De Soledad',
  })
  title: string;

  @Column('date', {
    name: 'release_date',
    transformer: {
      to: (value: Date) => value.toISOString().split('T')[0],
      from: (value: string) => new Date(value),
    },
  })
  @Expose()
  @ApiProperty({
    description: 'Book release date',
    type: String,
    format: 'date',
    example: '1967-05-30',
  })
  releaseDate: Date;

  @Column('bool', { name: 'active', default: true })
  @ApiHideProperty()
  active: boolean;

  @Column('varchar', { name: 'publisher', length: 50 })
  @Expose()
  @ApiProperty({
    description: 'Publishing house',
    example: 'Sudamericana',
  })
  publisher: string;

  @CreateDateColumn({
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @Expose()
  @ApiProperty({
    description: 'Creation timestamp',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @Column('uuid', { name: 'cover_id', nullable: true })
  @Expose()
  @ApiPropertyOptional({
    description: 'Associated cover id',
    format: 'uuid',
    example: '5d89a0fa-fb6d-4e65-ae09-111c6b334b7f',
  })
  coverId?: string;

  @OneToOne(() => Cover, (cover) => cover.book, { cascade: true, eager: true })
  @JoinColumn({ name: 'cover_id' })
  @Expose()
  @ApiPropertyOptional({
    description: 'Cover metadata object',
    type: () => Cover,
  })
  cover?: Cover;

  @BeforeInsert()
  @BeforeUpdate()
  private normalize() {
    if (this.author) this.author = capitalize(this.author);
    if (this.title) this.title = capitalize(this.title);
    if (this.publisher) this.publisher = capitalize(this.publisher);
    if (this.coWriter) this.coWriter = capitalize(this.coWriter);
  }
}
