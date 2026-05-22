import { Injectable } from '@nestjs/common';
import * as sql from 'mssql';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class CasinoRepository {
  constructor(private readonly database: DatabaseService) {}

  // ============================================
  // 1. Existing: Casino Config Details
  // ============================================
  async getCasinoDetails(casinoId: string) {
    const schema = this.database.schema;

    return this.database.query(
      (request) =>
        request.input('CasinoId', sql.Char(16), casinoId),
      `
        EXEC ${schema}.usp_GetCasinoConfigData
          @CasinoId = @CasinoId
      `,
    );
  }

  // ============================================
  // 2. NEW: LC Enabled Tables (usp_casinomap_info)
  // ============================================
  async getLCEnabledTables(casinoId: string) {
  const schema = this.database.schema;

  return this.database.query(
    (request) =>
      request.input('Casino_id', sql.Char(16), casinoId),  // FIXED
    `
      EXEC ${schema}.usp_casinomap_info
        @Casino_id = @Casino_id
    `,
  );
}
}
