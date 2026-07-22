import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('should default limit to 10', () => {
    const dto = new PaginationDto();

    expect(dto.limit).toBe(10);
  });

  it('should default page to 1', () => {
    const dto = new PaginationDto();

    expect(dto.page).toBe(1);
  });

  it('should have no errors when using the default values', async () => {
    const dto = new PaginationDto();

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should validate property limit must be positive', async () => {
    const dto = new PaginationDto();
    dto.limit = -1;

    const errors = await validate(dto);
    const limitError = errors.find((error) => error.property === 'limit');

    expect(limitError).toBeDefined();
    expect(limitError?.constraints).toHaveProperty('isPositive');
  });

  it('should validate property limit must be an integer', async () => {
    const dto = new PaginationDto();
    dto.limit = 1.5;

    const errors = await validate(dto);
    const limitError = errors.find((error) => error.property === 'limit');

    expect(limitError).toBeDefined();
    expect(limitError?.constraints).toHaveProperty('isInt');
  });

  it('should validate property page must be at least 1', async () => {
    const dto = new PaginationDto();
    dto.page = 0;

    const errors = await validate(dto);
    const pageError = errors.find((error) => error.property === 'page');

    expect(pageError).toBeDefined();
    expect(pageError?.constraints).toHaveProperty('min');
  });

  it('should validate property page must be an integer', async () => {
    const dto = new PaginationDto();
    dto.page = 1.5;

    const errors = await validate(dto);
    const pageError = errors.find((error) => error.property === 'page');

    expect(pageError).toBeDefined();
    expect(pageError?.constraints).toHaveProperty('isInt');
  });

  it('should transform a raw limit string into a number', () => {
    const dto = plainToInstance(PaginationDto, { limit: '5' });

    expect(dto.limit).toBe(5);
  });

  it('should transform a raw page string into a number', () => {
    const dto = plainToInstance(PaginationDto, { page: '2' });

    expect(dto.page).toBe(2);
  });
});
