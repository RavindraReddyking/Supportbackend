import type { Request } from 'express';
import { Controller, Get, Query, Req } from '@nestjs/common';
import { PlayerRangeDto } from '../../common/dto/lookup.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PlayerBetsService } from './player-bets.service';

@Controller()
export class PlayerBetsController {
  constructor(
    private readonly playerBetsService: PlayerBetsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('playerbetsinfo')
  async getInfo(@Query() dto: PlayerRangeDto, @Req() request: Request) {
    const response = await this.playerBetsService.getInfo(dto);

    this.auditLogService.capture(request, {
      action: 'PLAYER_BETS_SEARCH',
      entityType: 'player-bets',
      entityValue: `${dto.UserId} | ${dto.StartTime} -> ${dto.EndTime}`,
      status: 'SUCCESS',
    });

    return response;
  }
}
