/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginationResponseDto } from '@/common/dto/pagination-response.dto';
import { Book } from './entities/book.entity';

describe('BooksController', () => {
  let controller: BooksController;
  let service: BooksService;

  const mockBook: Book = {
    id: 'd95a8f87-7a2e-4f67-b432-7e9e9f69ea23',
    author: 'Gabriel Garcia Marquez',
    title: 'Cien Anos De Soledad',
    releaseDate: new Date('1967-05-30'),
    active: true,
    publisher: 'Sudamericana',
    createdAt: new Date('2026-01-01'),
  } as Book;

  const mockFile = { originalname: 'cover.jpg' } as Express.Multer.File;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      reactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [{ provide: BooksService, useValue: serviceMock }],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    service = module.get<BooksService>(BooksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new book without a cover file', async () => {
    const dto: CreateBookDto = {
      author: 'Gabriel Garcia Marquez',
      title: 'Cien Anos De Soledad',
      releaseDate: new Date('1967-05-30'),
      publisher: 'Sudamericana',
    };

    jest.spyOn(service, 'create').mockResolvedValue(mockBook);

    const result = await controller.create(dto, undefined);

    expect(service.create).toHaveBeenCalledWith(dto, undefined);
    expect(result).toEqual(mockBook);
  });

  it('should create a new book with a cover file', async () => {
    const dto: CreateBookDto = {
      author: 'Gabriel Garcia Marquez',
      title: 'Cien Anos De Soledad',
      releaseDate: new Date('1967-05-30'),
      publisher: 'Sudamericana',
    };

    jest.spyOn(service, 'create').mockResolvedValue(mockBook);

    const result = await controller.create(dto, mockFile);

    expect(service.create).toHaveBeenCalledWith(dto, mockFile);
    expect(result).toEqual(mockBook);
  });

  it('should return a paginated list of active books', async () => {
    const paginationDto: PaginationDto = { limit: 10, page: 1 };

    const paginated = new PaginationResponseDto([mockBook], 1, 1, 10);

    jest.spyOn(service, 'findAll').mockResolvedValue(paginated);

    const result = await controller.findAll(paginationDto);

    expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    expect(result).toEqual(paginated);
  });

  it('should return a book by id', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(mockBook);

    const result = await controller.findOne(mockBook.id);

    expect(service.findOne).toHaveBeenCalledWith(mockBook.id);
    expect(result).toEqual(mockBook);
  });

  it('should update a book', async () => {
    const dto: UpdateBookDto = { title: 'El Amor En Los Tiempos Del Colera' };
    const updatedBook = { ...mockBook, title: dto.title } as Book;

    jest.spyOn(service, 'update').mockResolvedValue(updatedBook);

    const result = await controller.update(mockBook.id, dto, undefined);

    expect(service.update).toHaveBeenCalledWith(mockBook.id, dto, undefined);
    expect(result).toEqual(updatedBook);
  });

  it('should soft delete a book', async () => {
    jest.spyOn(service, 'remove').mockResolvedValue(mockBook);

    const result = await controller.remove(mockBook.id);

    expect(service.remove).toHaveBeenCalledWith(mockBook.id);
    expect(result).toEqual(mockBook);
  });

  it('should reactivate a book', async () => {
    jest.spyOn(service, 'reactivate').mockResolvedValue(mockBook);

    const result = await controller.reactivate(mockBook.id);

    expect(service.reactivate).toHaveBeenCalledWith(mockBook.id);
    expect(result).toEqual(mockBook);
  });
});
