import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CasinoController } from './casino.controller';
import { CasinoRepository } from './casino.repository';
import { CasinoService } from './casino.service';

@Module({
  imports: [DatabaseModule, AuditLogModule],
  controllers: [CasinoController],
  providers: [CasinoService, CasinoRepository],
})
export class CasinoModule {}
