import { Controller, Post, UseFilters } from '@nestjs/common';
import { SeedService } from './seed.service';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';

@Controller('seed')
@UseFilters(QueryFailedErrorFilter)
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  populate() {
    return this.seedService.populate();
  }
}
