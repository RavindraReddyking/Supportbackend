import * as sql from 'mssql';
import { DatabaseService } from '../../database/database.service';
export declare class CasinoRepository {
    private readonly database;
    constructor(database: DatabaseService);
    getCasinoDetails(casinoId: string): Promise<sql.IResult<unknown>>;
    getLCEnabledTables(casinoId: string): Promise<sql.IResult<unknown>>;
}
