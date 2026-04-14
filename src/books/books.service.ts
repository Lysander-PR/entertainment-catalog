import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    await this.checkDuplicate(createBookDto.title, createBookDto.author);

    const book = this.bookRepository.create(this.capitalizeBook(createBookDto));

    return this.bookRepository.save(book);
  }

  findAll(paginationDto: PaginationDto): Promise<Book[]> {
    return this.bookRepository.find({
      take: paginationDto.limit,
      skip: (paginationDto.page - 1) * paginationDto.limit,
    });
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.bookRepository.findOneBy({ id });

    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);

    if (updateBookDto.author || updateBookDto.title) {
      const author = updateBookDto.author || book.author;
      const title = updateBookDto.title || book.title;
      await this.checkDuplicate(title, author);
    }

    const bookUpdated = this.bookRepository.merge(
      book,
      this.capitalizeBook(updateBookDto),
    );
    await this.bookRepository.update({ id }, bookUpdated);
    return book;
  }

  async remove(id: string): Promise<Book> {
    const book = await this.findOne(id);
    await this.bookRepository.delete({ id });
    return book;
  }

  private async checkDuplicate(title: string, author: string): Promise<void> {
    const exist = await this.bookRepository.existsBy({
      title: capitalize(title),
      author: capitalize(author),
    });

    if (exist) {
      throw new ConflictException(
        `Book with title "${title}" and author "${author}" already exists`,
      );
    }
  }

  private capitalizeBook(book: Partial<Book>): Partial<Book> {
    return {
      ...book,
      author: capitalize(book.author || ''),
      title: capitalize(book.title || ''),
      publisher: capitalize(book.publisher || ''),
      coWriter: book.coWriter ? capitalize(book.coWriter) : undefined,
    };
  }
}
