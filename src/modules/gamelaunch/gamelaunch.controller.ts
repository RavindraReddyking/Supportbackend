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
  @Body() body: any,
  @Req() request: Request,
) {
  try {
    const investigationPromise = body.token
      ? this.service.investigateSession({
          token: body.token,
          startDate: body.startDate,
          endDate: body.endDate,
          cookies:
            request?.headers?.cookie || '',
        })
      : this.service.investigate({
          url: body.url,
          startDate: body.startDate,
          endDate: body.endDate,
          cookies:
            request?.headers?.cookie || '',
        });

    const response = await Promise.race([
      investigationPromise,

      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'INVESTIGATION_TIMEOUT',
              ),
            ),
          180000, // 3 minutes
        ),
      ),
    ]);

    return response;
  } catch (error: any) {
    console.error('=========================');
    console.error('GAME LAUNCH ERROR');
    console.error(error);
    console.error(error?.stack);
    console.error(
      'STATUS:',
      error?.response?.status,
    );
    console.error(
      'RESPONSE:',
      error?.response?.data,
    );
    console.error('=========================');

    if (
      error?.message ===
      'INVESTIGATION_TIMEOUT'
    ) {
      return {
        success: false,
        error_code:
          'INVESTIGATION_TIMEOUT',
        message:
          'The investigation exceeded the maximum execution time of 3 minutes and was automatically terminated. Please narrow the search criteria and try again.',
      };
    }

    return {
      success: false,
      error: error?.message,
      response:
        error?.response?.data,
      status:
        error?.response?.status,
    };
  }
}
}