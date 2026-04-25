import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from './entities/book.entity';
import { CommonModule } from '@/common/common.module';

@Module({
  controllers: [BooksController],
  providers: [BooksService],
  imports: [TypeOrmModule.forFeature([Book]), CommonModule],
})
export class BooksModule {}
