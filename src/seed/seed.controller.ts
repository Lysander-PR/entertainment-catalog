import { Controller, Post, UseFilters } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { QueryFailedErrorFilter } from '@/common/filters/query-failed.filter';
import { Roles } from '@/user/types/enums/roles.enum';
import { Auth } from '@/auth/decorator/auth.decorator';

@Controller('seed')
@UseFilters(QueryFailedErrorFilter)
@Auth(Roles.ADMIN)
@ApiBearerAuth()
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  populate() {
    return this.seedService.populate();
  }
}
