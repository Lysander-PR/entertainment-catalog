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

    const book = this.bookRepository.create({
      author: capitalize(createBookDto.author),
      title: capitalize(createBookDto.title),
      releaseDate: createBookDto.releaseDate,
      publisher: capitalize(createBookDto.publisher),
      coWriter: createBookDto.coWriter
        ? capitalize(createBookDto.coWriter)
        : undefined,
    });

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

  update(id: string, updateBookDto: UpdateBookDto) {
    return `This action updates a #${id} book`;
  }

  async remove(id: string): Promise<Book> {
    const book = await this.findOne(id);
    await this.bookRepository.delete({ id });
    return book;
  }

  async checkDuplicate(title: string, author: string): Promise<boolean> {
    const exist = await this.bookRepository.existsBy({
      title: capitalize(title),
      author: capitalize(author),
    });

    if (exist) {
      throw new ConflictException(
        `Book with title "${title}" and author "${author}" already exists`,
      );
    }

    return true;
  }
}
