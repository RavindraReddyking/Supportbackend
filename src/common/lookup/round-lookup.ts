import { BadRequestException } from '@nestjs/common';
import * as sql from 'mssql';
import { RoundLookupParams } from '../../modules/round/round.types';

export type RoundLookupMode = 'RoundId' | 'GameIdUserId';

export function resolveRoundLookupMode(params: RoundLookupParams): RoundLookupMode {
  const hasRoundId = Boolean(params.roundId);
  const hasGameAndUser = Boolean(params.gameId && params.userId);

  if (!hasRoundId && !hasGameAndUser) {
    throw new BadRequestException(
      'Provide either RoundId or both GameId and UserId',
    );
  }

  if (hasRoundId && (params.gameId || params.userId)) {
    throw new BadRequestException(
      'Provide either RoundId only OR GameId and UserId only',
    );
  }

  return hasRoundId ? 'RoundId' : 'GameIdUserId';
}

export function configureRoundLookupRequest(
  request: sql.Request,
  params: RoundLookupParams,
): sql.Request {
  if (params.roundId) {
    return request.input('RoundId', sql.BigInt, params.roundId);
  }

  return request
    .input('GameId', sql.VarChar, params.gameId ?? '')
    .input('UserId', sql.VarChar, params.userId ?? '');
}
