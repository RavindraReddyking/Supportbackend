import * as sql from 'mssql';
import { RoundLookupParams } from '../../modules/round/round.types';
export type RoundLookupMode = 'RoundId' | 'GameIdUserId';
export declare function resolveRoundLookupMode(params: RoundLookupParams): RoundLookupMode;
export declare function configureRoundLookupRequest(request: sql.Request, params: RoundLookupParams): sql.Request;
