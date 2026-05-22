import { Injectable } from '@nestjs/common';
import { resolveRoundLookupMode } from '../../common/lookup/round-lookup';
import { RoundRepository } from './round.repository';
import { RoundLookupParams } from './round.types';

@Injectable()
export class RoundService {
  constructor(private readonly repository: RoundRepository) {}

  private validate(params: RoundLookupParams) {
    resolveRoundLookupMode(params);
  }

  private buildDisplayDescription(row: any): string {
    const description = String(row?.description ?? '').trim();

    if (!description) {
      return '';
    }

    return description.replace(/\bseat\s+(\d+)\b/i, (_match, seatValue) => {
      const dbSeat = Number(seatValue);

      if (Number.isNaN(dbSeat)) {
        return `seat ${seatValue}`;
      }

      const uiSeat = 8 - dbSeat;
      return `seat ${uiSeat}`;
    });
  }

  private mapBetTableRows(rows: any[]): any[] {
    return (rows ?? []).map((row) => ({
      ...row,
      displayDescription: this.buildDisplayDescription(row),
    }));
  }

  async getBetTable(params: RoundLookupParams): Promise<any> {
    this.validate(params);
    const result = await this.repository.getBetTable(params);
    const mappedRows = this.mapBetTableRows(result.recordset);

    return {
      success: true,
      api: 'bettableinfo',
      mode: params.roundId ? 'RoundId' : 'GameIdUserId',
      count: mappedRows.length,
      data: mappedRows,
    };
  }

  async getTptTable(params: RoundLookupParams): Promise<any> {
    this.validate(params);
    const result = await this.repository.getTptTable(params);

    return {
      success: true,
      api: 'tpttableinfo',
      mode: params.roundId ? 'RoundId' : 'GameIdUserId',
      count: result.recordset.length,
      data: result.recordset,
    };
  }

  async getCardDetails(params: RoundLookupParams): Promise<any> {
    this.validate(params);
    const result = await this.repository.getCardDetails(params);

    return {
      success: true,
      api: 'carddetails',
      mode: params.roundId ? 'RoundId' : 'GameIdUserId',
      count: result.recordset.length,
      data: result.recordset,
    };
  }

  async getGameDetails(params: RoundLookupParams): Promise<any> {
    this.validate(params);
    const result = await this.repository.getGameDetails(params);

    return {
      success: true,
      api: 'gamedetails',
      mode: params.roundId ? 'RoundId' : 'GameIdUserId',
      count: result.recordset.length,
      data: result.recordset,
    };
  }
}
