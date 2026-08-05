import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { paginate } from '@/common/helpers/paginate.helper';
import { CheckDuplicatesParams } from './types/interfaces/check-duplicates-params.interface';
import { CommonService } from '@/common/common.service';
import { buildStoragePath } from '@/common/helpers/build-storage-path.helper';
import { BuildStoragePath } from './types/interfaces/build-storage-path';
import { Cover } from '@/files/entities/cover.entity';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BOOKS_PATH } from './types/consts/books.const';
import { EntertainmentStorage } from '@/common/abstracts/entertainment-storage.abstract';

@Injectable()
export class BooksService extends EntertainmentStorage {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly commonService: CommonService,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    super(BOOKS_PATH);
  }

  async create(
    createBookDto: CreateBookDto,
    file?: Express.Multer.File,
  ): Promise<Book> {
    await this.checkDuplicate({
      title: createBookDto.title,
      author: createBookDto.author,
    });

    const uploadedPath = await this.commonService.handleUploadFile(
      this.storagePath({
        title: createBookDto.title,
        author: createBookDto.author,
      }),
      file,
    );

    return await this.commonService.handleTransactionWithFile(
      uploadedPath,
      this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        const book = manager.create(Book, createBookDto);

        if (uploadedPath) {
          const cover = await manager
            .getRepository(Cover)
            .save({ file: uploadedPath });

          book.coverId = cover.id;
        }

        await this.cacheManager.del(this.cacheKey);
        return await manager.save(book);
      }),
    );
  }

  findAll(paginationDto: PaginationDto): Promise<PaginationResponseDto<Book>> {
    return paginate(this.bookRepository, paginationDto, {
      where: { active: true },
    });
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.bookRepository.findOneBy({ id, active: true });

    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }

    return book;
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
    file?: Express.Multer.File,
  ): Promise<Book> {
    const book = await this.findOne(id);
    const author = updateBookDto.author || book.author;
    const title = updateBookDto.title || book.title;

    if (updateBookDto.author || updateBookDto.title) {
      await this.checkDuplicate({ title, author, id });
    }

    const uploadedPath = await this.commonService.handleUploadFile(
      this.storagePath({ author, title }),
      file,
    );
    const bookUpdated = this.bookRepository.merge(book, updateBookDto);

    return await this.commonService.handleTransactionWithFile(
      uploadedPath,
      this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        if (uploadedPath && !book.coverId) {
          const cover = await manager
            .getRepository(Cover)
            .save({ file: uploadedPath });

          bookUpdated.coverId = cover.id;
        }

        await this.cacheManager.del(`${this.cacheKey}/${id}`);
        await this.cacheManager.del(this.cacheKey);
        return await this.dataSource.manager.save(bookUpdated);
      }),
    );
  }

  async remove(id: string): Promise<Book> {
    const book = await this.findOne(id);
    await this.bookRepository.update({ id }, { active: false });
    await this.cacheManager.del(`${this.cacheKey}/${id}`);
    await this.cacheManager.del(this.cacheKey);
    return book;
  }

  async reactivate(id: string): Promise<Book> {
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with id ${id} failed to reactivate`);
    }

    await this.bookRepository.update({ id }, { active: true });
    return book;
  }

  private async checkDuplicate({
    id,
    title,
    author,
  }: CheckDuplicatesParams): Promise<void> {
    const exist = await this.bookRepository.existsBy({
      id: id ? Not(id) : undefined,
      title: capitalize(title),
      author: capitalize(author),
    });

    if (exist) {
      throw new ConflictException(
        `Book with title "${title}" and author "${author}" already exists`,
      );
    }
  }

  private storagePath({ author, title }: BuildStoragePath): string {
    return buildStoragePath(this.storageFolder, author, title);
  }
}
