import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { RoundController } from './round.controller';
import { RoundRepository } from './round.repository';
import { RoundService } from './round.service';

@Module({
  imports: [DatabaseModule, AuditLogModule],
  controllers: [RoundController],
  providers: [RoundService, RoundRepository],
})
export class RoundModule {}
