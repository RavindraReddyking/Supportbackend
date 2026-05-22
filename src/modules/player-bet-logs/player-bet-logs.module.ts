import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PlayerBetLogsController } from './player-bet-logs.controller';
import { PlayerBetLogsRepository } from './player-bet-logs.repository';
import { PlayerBetLogsService } from './player-bet-logs.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PlayerBetLogsController],
  providers: [PlayerBetLogsRepository, PlayerBetLogsService],
})
export class PlayerBetLogsModule {}