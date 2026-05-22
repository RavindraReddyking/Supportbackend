import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { PlayerBetsController } from './player-bets.controller';
import { PlayerBetsRepository } from './player-bets.repository';
import { PlayerBetsService } from './player-bets.service';

@Module({
  imports: [DatabaseModule, AuditLogModule],
  controllers: [PlayerBetsController],
  providers: [PlayerBetsService, PlayerBetsRepository],
})
export class PlayerBetsModule {}
