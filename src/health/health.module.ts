import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { ProbeHealthIndicator } from './indicators/probe.health';
import { CommonModule } from '@/common/common.module';
import { FilesModule } from '@/files/files.module';

@Module({
  imports: [TerminusModule, CommonModule, FilesModule],
  controllers: [HealthController],
  providers: [HealthService, ProbeHealthIndicator],
})
export class HealthModule {}
