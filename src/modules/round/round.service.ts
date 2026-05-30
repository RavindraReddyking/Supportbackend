import { Injectable } from '@nestjs/common';
import { resolveRoundLookupMode } from '../../common/lookup/round-lookup';
import { RoundRepository } from './round.repository';
import { RoundLookupParams, } from './round.types';
import { CrashGameParams, } from './round.types';

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

async getHighflyerData(params: CrashGameParams): Promise<any> {
  this.validate(params);

  const result = await this.repository.getHighflyerData(params);

  return {
    success: true,
    api: 'crashgamesdata-highflyer',
    mode: params.roundId ? 'RoundId' : 'GameIdUserId',
    count: result.recordset.length,
    data: result.recordset,
  };
}

async getCrashCommonData(params: CrashGameParams): Promise<any> {
  this.validate(params);

  const result = await this.repository.getCrashCommonData(params);

  const mappedData = result.recordset.map((row: any) => ({
    ...row, // ✅ keep ALL DB columns

    // ✅ Full Auto Cashout
    Full_AutoCashout_OptedMultiplier:
      row.multiplier === -1 ? 'Not Opted' : row.multiplier,

    // ✅ Half Auto Cashout
    Half_AutoCashout_OptedMultiplier:
      row.halfmultiplier === -1 ? 'Not Opted' : row.halfmultiplier,

    // ✅ Half Cashout
    HalfCashout_Type:
      row.HC_TYPE === null ? 'Not Cashed Out' : row.HC_TYPE,

    // ✅ Full Cashout
    FullCashout_Type:
      row.CO_TYPE === null ? 'Not Cashed Out' : row.CO_TYPE,

    // ✅ Bet Amounts
    HalfCashoutBetAmount: row.HC_BetAmount,
    FullCashoutBetAmount: row.FC_BetAmount,

    // ✅ Payouts
    HalfCashoutPayout_Amount: row.HC_CashPayOut,
    FullCashoutPayout_Amount: row.FC_CashPayOut,

    // ✅ Requested multipliers
    HalfCashoutRequested_Multiplier:
      row.HC_Requested === null ? 'Not Requested' : row.HC_Requested,

    FullCashoutRequested_Multiplier:
      row.FC_Requested === null ? 'Not Requested' : row.FC_Requested,

    // ✅ Request Times
    HalfCashoutRequestTime:
      row.HC_RequestTime === null ? 'Not Requested' : row.HC_RequestTime,

    FullCashoutRequestTime:
      row.FC_RequestTime === null ? 'Not Requested' : row.FC_RequestTime,

    // ✅ Settle Times
    HalfCashoutSettleTime:
      row.HC_SettleTime === null ? 'NA' : row.HC_SettleTime,

    FullCashoutSettleTime:
      row.FC_SettleTime === null ? 'NA' : row.FC_SettleTime,
  }));

  return {
    success: true,
    api: 'crashgamesdata-common',
    mode: params.roundId ? 'RoundId' : 'GameIdUserId',
    count: mappedData.length,
    data: mappedData,
  };
}

}