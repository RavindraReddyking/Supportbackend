import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';
export declare class DatabaseService {
    private readonly config;
    private poolPromise;
    constructor(config: ConfigService);
    get dbenv(): string;
    get schema(): string;
    private getConnectionConfig;
    getPool(): Promise<sql.ConnectionPool>;
    query<T = unknown>(configure: (request: sql.Request) => sql.Request, query: string): Promise<sql.IResult<T>>;
}
