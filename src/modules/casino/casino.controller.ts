import type { Request } from 'express';
import { Controller, Get, Query, Req } from '@nestjs/common';
import { CasinoLookupDto } from '../../common/dto/lookup.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CasinoService } from './casino.service';

@Controller()
export class CasinoController {
  constructor(
    private readonly casinoService: CasinoService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ============================================
  // 1. Casino Details API
  // ============================================
  @Get('casinodetails')
  async getDetails(@Query() dto: CasinoLookupDto, @Req() request: Request) {
    if (!dto.casinoid || !dto.casinoid.trim()) {
      return {
        success: false,
        message: 'casinoid is required',
      };
    }

    const response = await this.casinoService.getDetails(dto.casinoid);

    this.auditLogService.capture(request, {
      action: 'CASINO_CONFIG_SEARCH',
      entityType: 'casino-config',
      entityValue: dto.casinoid,
      status: response.data.casino ? 'SUCCESS' : 'NOT_FOUND',
    });

    return response;
  }

  // ============================================
  // 2. LC Enabled Tables API
  // ============================================
  @Get('lc-enabled-tables')
  async getLCEnabledTables(@Query() dto: CasinoLookupDto, @Req() request: Request) {
    if (!dto.casinoid || !dto.casinoid.trim()) {
      return {
        success: false,
        message: 'casinoid is required',
      };
    }

    const response = await this.casinoService.getLCEnabledTables(dto.casinoid);

    this.auditLogService.capture(request, {
      action: 'LC_ENABLED_TABLES_SEARCH',
      entityType: 'casino-config',
      entityValue: dto.casinoid,
      status: response.data?.length ? 'SUCCESS' : 'NOT_FOUND',
    });

    return response;
  }
}
