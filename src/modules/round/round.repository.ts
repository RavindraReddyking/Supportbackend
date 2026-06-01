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
        EXEC ${schema}.usp_SpacemanPlayerData
          @RoundId = @RoundId
        `
        : `
          EXEC ${schema}.usp_SpacemanPlayerData
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

async getHighflyerData (params: CrashGameParams) {
  const schema = this.database.schema;
  const mode = resolveRoundLookupMode(params);

  const query =
    mode === 'RoundId'
      ? ` EXEC ${schema}.usp_CrashedGamePlayerData
          @RoundId = @RoundId
        `
        : `
          EXEC ${schema}.usp_CrashedGamePlayerData
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
}