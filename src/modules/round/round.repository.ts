import { Injectable } from '@nestjs/common';
import { CrashGameParams } from './round.types';

import {
  configureRoundLookupRequest,
  resolveRoundLookupMode,
} from '../../common/lookup/round-lookup';
import { DatabaseService } from '../../database/database.service';
import { RoundLookupParams } from './round.types';

@Injectable()
export class RoundRepository {
  constructor(private readonly database: DatabaseService) {}

  async getBetTable(params: RoundLookupParams) {
    const schema = this.database.schema;
    const mode = resolveRoundLookupMode(params);

    return this.database.query(
      (request) => configureRoundLookupRequest(request, params),
      mode === 'RoundId'
        ? `
          EXEC ${schema}.usp_GetBetData
          @RoundId = @RoundId
        `
        : `
          EXEC ${schema}.usp_GetBetData
          @GameId = @GameId,
          @UserId = @UserId
        `,
    );
  }

  async getTptTable(params: RoundLookupParams) {
    const schema = this.database.schema;
    const mode = resolveRoundLookupMode(params);

    return this.database.query(
      (request) => configureRoundLookupRequest(request, params),
      mode === 'RoundId'
        ? `
          EXEC ${schema}.usp_GetThirdPartyTxnData
          @RoundId = @RoundId
        `
        : `
          EXEC ${schema}.usp_GetThirdPartyTxnData
          @GameId = @GameId,
          @UserId = @UserId
        `,
    );
  }

  async getCardDetails(params: RoundLookupParams) {
    const schema = this.database.schema;
    const mode = resolveRoundLookupMode(params);

    return this.database.query(
      (request) => configureRoundLookupRequest(request, params),
      mode === 'RoundId'
        ? `
          EXEC ${schema}.usp_GetGameDetailsCG
          @RoundId = @RoundId
        `
        : `
          EXEC ${schema}.usp_GetGameDetailsCG
          @GameId = @GameId,
          @UserId = @UserId
        `,
    );
  }

  async getGameDetails(params: RoundLookupParams) {
    const schema = this.database.schema;
    const mode = resolveRoundLookupMode(params);

    const query =
      mode === 'RoundId'
        ? `
          EXEC ${schema}.usp_GetTableGameDetails
          @RoundId = @RoundId
        `
        : `
          EXEC ${schema}.usp_GetTableGameDetails
          @GameId = @GameId,
          @UserId = @UserId
        `;

    try {
      return await this.database.query(
        (request) => configureRoundLookupRequest(request, params),
        query,
      );
    } catch (error) {
      throw error;
    }
  }

async getCrashCommonData (params: CrashGameParams) {
  const schema = this.database.schema;
  const mode = resolveRoundLookupMode(params);

  const query =
    mode === 'RoundId'
      ? `
        Select
             bet_id,multiplier,processedCashout,requestedCashout,createdOn,ck,halfmultiplier,HC_TYPE,CO_TYPE,HC_MUL,CO_MUL,HC_BetAmount,
	        FC_BetAmount,HC_CashPayOut,FC_CashPayOut,HC_Requested,FC_Requested,HC_RequestTime,FC_RequestTime,HC_SettleTime,FC_SettleTime,
		   Updated_on,Deleted_on,Disconnected,betAmount,gameId,userId
            From live.dbo.SpacemanPlayerData spd with(nolock)
		  INNER JOIN live.dbo.Round r WITH (NOLOCK)
        ON spd.userid = r.user_id
       AND spd.gameid = r.game_id
    WHERE r.round_id = @RoundId
      `
      : `
       Select
             bet_id,multiplier,processedCashout,requestedCashout,createdOn,ck,halfmultiplier,HC_TYPE,CO_TYPE,HC_MUL,CO_MUL,HC_BetAmount,
	        FC_BetAmount,HC_CashPayOut,FC_CashPayOut,HC_Requested,FC_Requested,HC_RequestTime,FC_RequestTime,HC_SettleTime,FC_SettleTime,
		   Updated_on,Deleted_on,Disconnected,betAmount,gameId,userId
            From live.dbo.SpacemanPlayerData spd with(nolock)
		  INNER JOIN live.dbo.Round r WITH (NOLOCK)
        ON spd.userid = r.user_id
       AND spd.gameid = r.game_id
    WHERE r.game_id = @GameId 
    AND r.user_id = @UserId
      `;

  try {
    return await this.database.query(
      (request) => configureRoundLookupRequest(request, params),
      query,
    );
  } catch (error) {
    throw error;
  }
}

async getHighflyerData (params: CrashGameParams) {
  const schema = this.database.schema;
  const mode = resolveRoundLookupMode(params);

  const query =
    mode === 'RoundId'
      ? `
       		   SELECT 
        cgpd.bet_id,
        cgpd.multiplier,
        cgpd.force_cash_out,
        cgpd.force_cash_out_initiated_time,
        cgpd.requested_cash_out,
        cgpd.requested_cash_out_initiated_time,
        cgpd.auto_cash_out,
        cgpd.auto_cash_out_initiated_time,
        cgpd.bet_amount,
        cgpd.created_time,
        cgpd.is_disconnected,
        cgpd.disconnected_time,
        cgpd.game_id,
        cgpd.user_id,
        cgpd.table_id,
        cgpd.jackpot
    FROM  live.dbo.CrashedGamePlayerData cgpd WITH (NOLOCK)
    INNER JOIN  live.dbo.Round r WITH (NOLOCK)
        ON cgpd.user_id = r.user_id
       AND cgpd.game_id = r.game_id
    WHERE r.round_id = @RoundId
      `
      : `
       	SELECT 
        cgpd.bet_id,
        cgpd.multiplier,
        cgpd.force_cash_out,
        cgpd.force_cash_out_initiated_time,
        cgpd.requested_cash_out,
        cgpd.requested_cash_out_initiated_time,
        cgpd.auto_cash_out,
        cgpd.auto_cash_out_initiated_time,
        cgpd.bet_amount,
        cgpd.created_time,
        cgpd.is_disconnected,
        cgpd.disconnected_time,
        cgpd.game_id,
        cgpd.user_id,
        cgpd.table_id,
        cgpd.jackpot
    FROM  live.dbo.CrashedGamePlayerData cgpd WITH (NOLOCK)
    INNER JOIN  live.dbo.Round r WITH (NOLOCK)
        ON cgpd.user_id = r.user_id
       AND cgpd.game_id = r.game_id
        WHERE r.game_id = @GameId
        AND r.user_id = @UserId
      `;

  try {
    return await this.database.query(
      (request) => configureRoundLookupRequest(request, params),
      query,
    );
  } catch (error) {
    throw error;
  }
}
}