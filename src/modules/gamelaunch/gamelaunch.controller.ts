import type { Request } from 'express';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { GameLaunchService } from './gamelaunch.service';

import { CasinoLookupDto } from '../../common/dto/lookup.dto';

import { AuditLogService } from '../audit-log/audit-log.service';

@Controller('gamelaunch')
export class GameLaunchController {
  constructor(
    private readonly service: GameLaunchService,

    private readonly auditLogService: AuditLogService,
  ) {}

  // ============================================
  // 1. Platform Enabled Games
  // ============================================

  @Get('platformenabledtables')
  async getGames(
    @Query() query: CasinoLookupDto,

    @Req() request: Request,
  ) {
    if (
      !query.casinoid ||
      !query.casinoid.trim()
    ) {
      return {
        success: false,
        message: 'casinoid is required',
      };
    }

    const response =
      await this.service.getCasinoGames(
        query.casinoid,
      );

    this.auditLogService.capture(
      request,
      {
        action:
          'PLATFORM_GAMES_SEARCH',

        entityType:
          'platform-games',

        entityValue:
          query.casinoid,

        status:
          response?.data?.games
            ?.length
            ? 'SUCCESS'
            : 'NOT_FOUND',
      },
    );

    return response;
  }

  // ============================================
  // 2. Investigation
  // ============================================

  @Post('investigate')
  async investigate(
    @Body()
    body: {
      url?: string;
      token?: string;
      startDate?: string;
      endDate?: string;
    },

    @Req() request?: Request,
  ) {
    if (
      (!body?.url ||
        !body.url.trim()) &&
      (!body?.token ||
        !body.token.trim())
    ) {
      return {
        success: false,
        message:
          'url or token is required',
      };
    }

    const response =
      body.token
        ? await this.service
            .investigateSession({
              token: body.token,

              startDate:
                body.startDate,

              endDate:
                body.endDate,

              cookies:
                request?.headers
                  ?.cookie || '',
            })
        : await this.service
            .investigate({
              url: body.url!,

              startDate:
                body.startDate,

              endDate:
                body.endDate,

              cookies:
                request?.headers
                  ?.cookie || '',
            });

    this.auditLogService.capture(
      request,
      {
        action:
          body.token
            ? 'SESSION_ANALYSIS'
            : 'GAMELAUNCH_INVESTIGATE',

        entityType:
          body.token
            ? 'session-analysis'
            : 'gamelaunch-investigation',

        entityValue:
          body.token ||
          body.url ||
          '',

        status:
          response?.success
            ? 'SUCCESS'
            : 'FAILED',
      },
    );

    return response;
  }
}