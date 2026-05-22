import type { Request } from 'express';
import { Controller, Get, Query, Req } from '@nestjs/common';
import { RoundLookupDto } from '../../common/dto/lookup.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { RoundService } from './round.service';

@Controller()
export class RoundController {
  constructor(
    private readonly roundService: RoundService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('bettableinfo')
  async getBetTable(@Query() dto: RoundLookupDto, @Req() request: Request) {
    const normalized = dto.normalized();
    const response = await this.roundService.getBetTable(normalized);

    this.auditLogService.capture(request, {
      action: 'BET_LIFECYCLE_SEARCH',
      entityType: 'bet-table',
      entityValue: normalized.roundId || `${normalized.gameId}|${normalized.userId}`,
      status: 'SUCCESS',
      metadata: { target: 'bettableinfo' },
    });

    return response;
  }

  @Get('tpttableinfo')
  async getTptTable(@Query() dto: RoundLookupDto, @Req() request: Request) {
    const normalized = dto.normalized();
    const response = await this.roundService.getTptTable(normalized);

    this.auditLogService.capture(request, {
      action: 'BET_LIFECYCLE_SEARCH',
      entityType: 'tpt-table',
      entityValue: normalized.roundId || `${normalized.gameId}|${normalized.userId}`,
      status: 'SUCCESS',
      metadata: { target: 'tpttableinfo' },
    });

    return response;
  }

  @Get('carddetails')
  async getCardDetails(@Query() dto: RoundLookupDto, @Req() request: Request) {
    const normalized = dto.normalized();
    const response = await this.roundService.getCardDetails(normalized);

    this.auditLogService.capture(request, {
      action: 'BET_LIFECYCLE_SEARCH',
      entityType: 'card-details',
      entityValue: normalized.roundId || `${normalized.gameId}|${normalized.userId}`,
      status: 'SUCCESS',
      metadata: { target: 'carddetails' },
    });

    return response;
  }

  @Get('gamedetails')
  async getGameDetails(@Query() dto: RoundLookupDto, @Req() request: Request) {
    const normalized = dto.normalized();
    const response = await this.roundService.getGameDetails(normalized);

    this.auditLogService.capture(request, {
      action: 'BET_LIFECYCLE_SEARCH',
      entityType: 'game-details',
      entityValue: normalized.roundId || `${normalized.gameId}|${normalized.userId}`,
      status: 'SUCCESS',
      metadata: { target: 'gamedetails' },
    });

    return response;
  }
}
