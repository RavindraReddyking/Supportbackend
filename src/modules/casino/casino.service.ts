import { Injectable } from '@nestjs/common';
import { ApiResponse, ApiListResponse } from '../../common/types/api-response';
import { CasinoRepository } from './casino.repository';

@Injectable()
export class CasinoService {
  constructor(private readonly repository: CasinoRepository) {}

  // ============================================
  // 1. Existing: Casino Details API
  // ============================================
  async getDetails(casinoId: string): Promise<ApiResponse<any>> {
    const result = await this.repository.getCasinoDetails(casinoId);

    // First result set → main casino details (1 row)
    const main = result.recordsets[0]?.[0] || null;

    // Second result set → shared environments (0..N rows)
    const shared = result.recordsets[1] || [];

    return {
      success: true,
      api: 'casinodetails',
      data: {
        casino: main,
        shared_envs: shared,
      },
    };
  }

  // ============================================
  // 2. NEW: LC Enabled Tables API (List Response)
  // ============================================
  async getLCEnabledTables(casinoId: string): Promise<ApiListResponse<any>> {
    const result = await this.repository.getLCEnabledTables(casinoId);

    return {
      success: true,
      api: 'lc-enabled-tables',
      count: result.recordset.length,
      data: result.recordset,
    };
  }
}
