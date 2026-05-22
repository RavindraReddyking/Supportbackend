import * as sql from 'mssql';
import { DatabaseService } from '../../database/database.service';
export declare class PlayerBetsRepository {
    private readonly database;
    constructor(database: DatabaseService);
    getPlayerBets(playerId: string, fromDate: Date, toDate: Date): Promise<sql.IResult<unknown>>;
}
