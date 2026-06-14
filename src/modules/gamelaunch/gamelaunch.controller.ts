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
        message:
          'casinoid is required',
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
  // 2. GameLaunch Investigation
  // ============================================

  @Post('investigate')
  async investigate(
    @Body()
    body: {
      url: string;
      startDate?: string;
      endDate?: string;
    },

    @Req() request?: Request,
  ) {
    if (
      !body?.url ||
      !body.url.trim()
    ) {
      return {
        success: false,
        message:
          'url is required',
      };
    }

    const response =
      await this.service.investigate({
        url: body.url,

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
          'GAMELAUNCH_INVESTIGATE',

        entityType:
          'gamelaunch-investigation',

        entityValue:
          body.url,

        status:
          response?.success
            ? 'SUCCESS'
            : 'FAILED',
      },
    );

    return response;
  }
}