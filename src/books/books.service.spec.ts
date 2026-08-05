/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Not, Repository } from 'typeorm';

import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { Cover } from '@/files/entities/cover.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { CommonService } from '@/common/common.service';
import { capitalize } from '@/common/helpers/capitalize.helper';
import { buildStoragePath } from '@/common/helpers/build-storage-path.helper';
import { BOOKS_PATH } from './types/consts/books.const';
import { APP_PREFIX } from '@/common/types/consts/app-prefix.const';
import { CacheService } from '@/common/cache/cache.service';

describe('BooksService', () => {
  let service: BooksService;
  let repository: Repository<Book>;
  let commonService: CommonService;
  let dataSource: DataSource;
  let cacheService: { deleteByPrefix: jest.Mock };
  let managerMock: {
    create: jest.Mock;
    save: jest.Mock;
    getRepository: jest.Mock;
  };

  const cacheKey = `/${APP_PREFIX}/${BOOKS_PATH}`;

  const mockBook: Book = {
    id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    author: 'Gabriel Garcia Marquez',
    title: 'Cien Anos De Soledad',
    releaseDate: new Date('1967-05-30'),
    active: true,
    publisher: 'Sudamericana',
    createdAt: new Date('2026-01-01'),
  } as Book;

  const dto: CreateBookDto = {
    author: 'Gabriel Garcia Marquez',
    title: 'Cien Anos De Soledad',
    releaseDate: new Date('1967-05-30'),
    publisher: 'Sudamericana',
  };

  const updateDto: UpdateBookDto = { publisher: 'New Publisher' };

  beforeEach(async () => {
    const repositoryMock = {
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
      update: jest.fn(),
      existsBy: jest.fn(),
    };

    const commonServiceMock = {
      handleUploadFile: jest.fn(),
      handleTransactionWithFile: jest
        .fn()
        .mockImplementation((_uploadedPath, transaction) => transaction),
    };

    managerMock = {
      create: jest.fn(),
      save: jest.fn(),
      getRepository: jest.fn(),
    };

    const dataSourceMock = {
      transaction: jest
        .fn()
        .mockImplementation((_level, work) => work(managerMock)),
      manager: { save: jest.fn() },
    };

    const cacheServiceMock = { deleteByPrefix: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: getRepositoryToken(Book), useValue: repositoryMock },
        { provide: CommonService, useValue: commonServiceMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get<Repository<Book>>(getRepositoryToken(Book));
    commonService = module.get<CommonService>(CommonService);
    dataSource = module.get<DataSource>(DataSource);
    cacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException if a book with the same title and author already exists', async () => {
    jest.spyOn(repository, 'existsBy').mockResolvedValue(true);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(commonService.handleUploadFile).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should create a book without a cover file', async () => {
    const storagePath = buildStoragePath(BOOKS_PATH, dto.author, dto.title);

    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    jest.spyOn(commonService, 'handleUploadFile').mockResolvedValue(null);
    managerMock.create.mockReturnValue({ ...dto });
    managerMock.save.mockResolvedValue(mockBook);

    const result = await service.create(dto);

    expect(repository.existsBy).toHaveBeenCalledWith({
      id: undefined,
      title: capitalize(dto.title),
      author: capitalize(dto.author),
    });
    expect(commonService.handleUploadFile).toHaveBeenCalledWith(
      storagePath,
      undefined,
    );
    expect(managerMock.create).toHaveBeenCalledWith(Book, dto);
    expect(managerMock.getRepository).not.toHaveBeenCalled();
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(managerMock.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockBook);
  });

  it('should upload and link a cover file when provided on create', async () => {
    const file = { originalname: 'cover.jpg' } as Express.Multer.File;
    const uploadedPath = buildStoragePath(BOOKS_PATH, dto.author, dto.title);
    const bookDraft = { ...dto } as Book;
    const coverRepositoryMock = {
      save: jest.fn().mockResolvedValue({ id: 'cover-id' }),
    };

    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    jest
      .spyOn(commonService, 'handleUploadFile')
      .mockResolvedValue(uploadedPath);
    managerMock.create.mockReturnValue(bookDraft);
    managerMock.getRepository.mockReturnValue(coverRepositoryMock);
    managerMock.save.mockImplementation((book) => Promise.resolve(book));

    const result = await service.create(dto, file);

    expect(commonService.handleUploadFile).toHaveBeenCalledWith(
      uploadedPath,
      file,
    );
    expect(managerMock.getRepository).toHaveBeenCalledWith(Cover);
    expect(coverRepositoryMock.save).toHaveBeenCalledWith({
      file: uploadedPath,
    });
    expect(bookDraft.coverId).toBe('cover-id');
    expect(result).toEqual(bookDraft);
  });

  it('should return a paginated list of active books', async () => {
    const paginationDto: PaginationDto = { limit: 5, page: 2 };

    jest.spyOn(repository, 'findAndCount').mockResolvedValue([[mockBook], 11]);

    const result = await service.findAll(paginationDto);

    expect(repository.findAndCount).toHaveBeenCalledWith({
      take: paginationDto.limit,
      skip: (paginationDto.page - 1) * paginationDto.limit,
      where: { active: true },
    });
    expect(result).toEqual(new PaginationResponseDto([mockBook], 11, 2, 5));
  });

  it('should return a book by id', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockBook);

    const result = await service.findOne(mockBook.id);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      id: mockBook.id,
      active: true,
    });
    expect(result).toEqual(mockBook);
  });

  it('should throw NotFoundException from findOne if the book does not exist', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

    await expect(service.findOne(mockBook.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update a book and invalidate both cache entries', async () => {
    const mergedBook = { ...mockBook, ...updateDto } as Book;

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockBook);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedBook);
    jest.spyOn(commonService, 'handleUploadFile').mockResolvedValue(null);
    jest.spyOn(dataSource.manager, 'save').mockResolvedValue(mergedBook);

    const result = await service.update(mockBook.id, updateDto);

    expect(repository.merge).toHaveBeenCalledWith(mockBook, updateDto);
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(dataSource.manager.save).toHaveBeenCalledWith(mergedBook);
    expect(result).toEqual(mergedBook);
  });

  it('should check duplicates when the title or author changes', async () => {
    const titleDto: UpdateBookDto = { title: 'New Title' };
    const mergedBook = { ...mockBook, ...titleDto } as Book;

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockBook);
    jest.spyOn(repository, 'existsBy').mockResolvedValue(false);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedBook);
    jest.spyOn(commonService, 'handleUploadFile').mockResolvedValue(null);
    jest.spyOn(dataSource.manager, 'save').mockResolvedValue(mergedBook);

    await service.update(mockBook.id, titleDto);

    expect(repository.existsBy).toHaveBeenCalledWith({
      id: Not(mockBook.id),
      title: capitalize(titleDto.title as string),
      author: capitalize(mockBook.author),
    });
  });

  it('should throw ConflictException if the updated title/author belongs to another book', async () => {
    const titleDto: UpdateBookDto = { title: 'Duplicate Title' };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockBook);
    jest.spyOn(repository, 'existsBy').mockResolvedValue(true);

    await expect(service.update(mockBook.id, titleDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(commonService.handleUploadFile).not.toHaveBeenCalled();
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should upload and link a cover file when the book has none on update', async () => {
    const file = { originalname: 'cover.jpg' } as Express.Multer.File;
    const uploadedPath = 'books/new-cover-path';
    const bookWithoutCover = { ...mockBook, coverId: undefined } as Book;
    const mergedBook = { ...bookWithoutCover, ...updateDto } as Book;
    const coverRepositoryMock = {
      save: jest.fn().mockResolvedValue({ id: 'new-cover-id' }),
    };

    jest.spyOn(repository, 'findOneBy').mockResolvedValue(bookWithoutCover);
    jest.spyOn(repository, 'merge').mockReturnValue(mergedBook);
    jest
      .spyOn(commonService, 'handleUploadFile')
      .mockResolvedValue(uploadedPath);
    managerMock.getRepository.mockReturnValue(coverRepositoryMock);
    jest
      .spyOn(dataSource.manager, 'save')
      .mockImplementation((book) => Promise.resolve(book));

    await service.update(mockBook.id, updateDto, file);

    expect(managerMock.getRepository).toHaveBeenCalledWith(Cover);
    expect(coverRepositoryMock.save).toHaveBeenCalledWith({
      file: uploadedPath,
    });
    expect(mergedBook.coverId).toBe('new-cover-id');
  });

  it('should desactivate a book and invalidate both cache entries', async () => {
    jest.spyOn(repository, 'findOneBy').mockResolvedValue(mockBook);
    jest.spyOn(repository, 'update').mockResolvedValue({} as never);

    const result = await service.remove(mockBook.id);

    expect(repository.update).toHaveBeenCalledWith(
      { id: mockBook.id },
      { active: false },
    );
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mockBook);
  });

  it('should reactivate a book and invalidate the cache prefix', async () => {
    const inactiveBook = { ...mockBook, active: false } as Book;

    jest.spyOn(repository, 'findOne').mockResolvedValue(inactiveBook);
    jest.spyOn(repository, 'update').mockResolvedValue({} as never);

    const result = await service.reactivate(mockBook.id);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: mockBook.id },
    });
    expect(repository.update).toHaveBeenCalledWith(
      { id: mockBook.id },
      { active: true },
    );
    expect(cacheService.deleteByPrefix).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(inactiveBook);
  });

  it('should throw NotFoundException from reactivate if the book does not exist', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    await expect(service.reactivate(mockBook.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.update).not.toHaveBeenCalled();
    expect(cacheService.deleteByPrefix).not.toHaveBeenCalled();
  });
});
