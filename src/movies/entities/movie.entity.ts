import { capitalize } from '@/common/helpers/capitalize.helper';
import { Cover } from '@/files/entities/cover.entity';
import { Exclude, Expose } from 'class-transformer';
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
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

@Entity('movies')
@Exclude()
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  @ApiProperty({
    description: 'Unique identifier of the movie',
    example: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    format: 'uuid',
  })
  id: string;

  @Column('varchar', { name: 'director', length: 30 })
  @Expose()
  @ApiProperty({
    description: 'Director name',
    example: 'Denis Villeneuve',
  })
  director: string;

  @Column('varchar', { name: 'title', length: 30 })
  @Expose()
  @ApiProperty({
    description: 'Movie title',
    example: 'Dune',
  })
  title: string;

  @Column('varchar', { name: 'writer', length: 30 })
  @Expose()
  @ApiProperty({
    description: 'Writer name',
    example: 'Jon Spaihts',
  })
  writer: string;

  @Column('varchar', { name: 'studio', length: 20 })
  @Expose()
  @ApiProperty({
    description: 'Production studio',
    example: 'Warner Bros',
  })
  studio: string;

  @Column('varchar', { name: 'protagonist', length: 30 })
  @Expose()
  @ApiProperty({
    description: 'Main protagonist actor/actress',
    example: 'Timothee Chalamet',
  })
  protagonist: string;

  @Column('date', {
    name: 'release_date',
    transformer: {
      to: (value: Date) => value.toISOString().split('T')[0],
      from: (value: string) => new Date(value),
    },
  })
  @Expose()
  @ApiProperty({
    description: 'Movie release date',
    type: String,
    format: 'date',
    example: '2021-10-22',
  })
  releaseDate: Date;

  @Column('text', { name: 'soundtrack', nullable: true })
  @Expose()
  @ApiPropertyOptional({
    description: 'Optional soundtrack URL',
    example: 'https://open.spotify.com/track/example',
  })
  soundtrack?: string;

  @Column('bool', { name: 'active', default: true })
  @ApiHideProperty()
  active: boolean;

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

  @Column('uuid', { name: 'poster_id', nullable: true })
  @Expose()
  @ApiPropertyOptional({
    description: 'Associated poster id',
    format: 'uuid',
    example: '5d89a0fa-fb6d-4e65-ae09-111c6b334b7f',
  })
  posterId?: string;

  @OneToOne(() => Cover, (cover) => cover.movie, { cascade: true, eager: true })
  @JoinColumn({ name: 'poster_id' })
  @Expose()
  @ApiPropertyOptional({
    description: 'Poster metadata object',
    type: Object,
  })
  poster?: Cover;

  @BeforeInsert()
  @BeforeUpdate()
  private normalize() {
    if (this.director) this.director = capitalize(this.director);
    if (this.title) this.title = capitalize(this.title);
    if (this.writer) this.writer = capitalize(this.writer);
    if (this.studio) this.studio = capitalize(this.studio);
    if (this.protagonist) this.protagonist = capitalize(this.protagonist);
  }
}
