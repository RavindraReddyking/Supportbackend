import { DatabaseService } from '../../database/database.service';
import { RoundLookupParams } from './round.types';
export declare class RoundRepository {
    private readonly database;
    constructor(database: DatabaseService);
    getBetTable(params: RoundLookupParams): Promise<import("mssql").IResult<unknown>>;
    getTptTable(params: RoundLookupParams): Promise<import("mssql").IResult<unknown>>;
    getCardDetails(params: RoundLookupParams): Promise<import("mssql").IResult<unknown>>;
    getGameDetails(params: RoundLookupParams): Promise<import("mssql").IResult<unknown>>;
}
