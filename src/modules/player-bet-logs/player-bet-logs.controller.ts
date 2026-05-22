import { Controller, Get, Query } from '@nestjs/common';
import { PlayerBetLogsService } from './player-bet-logs.service';
import { GameType } from './player-bet-logs.types';

@Controller('playerbetlogs')
export class PlayerBetLogsController {
  constructor(private readonly service: PlayerBetLogsService) {}

  @Get()
  async getPlayerBetLogs(
    @Query('roundId') roundId?: string,
    @Query('gameId') gameId?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getPlayerBetLogs({
      roundId: roundId ?? '',
      gameId: gameId ?? '',
      userId: userId ?? '',
      from: from ?? '',
      to: to ?? '',
    });
  }

  @Get('transactionlogs')
  async getTransactionLogs(
    @Query('roundId') roundId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getTransactionLogs({
      roundId: roundId ?? '',
      from: from ?? '',
      to: to ?? '',
    });
  }

  @Get('gamelogs')
  async getGameLogs(
    @Query('gameId') gameId?: string,
    @Query('userId') userId?: string,
    @Query('gameType') gameType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getGameLogs({
      gameId: gameId ?? '',
      userId: userId ?? '',
      gameType: (gameType ?? 'GENERIC') as GameType,
      from: from ?? '',
      to: to ?? '',
    });
  }
}
