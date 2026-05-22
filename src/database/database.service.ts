import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

@Injectable()
export class DatabaseService {
  private poolPromise: Promise<sql.ConnectionPool> | null = null;

  constructor(private readonly config: ConfigService) {}

  get dbenv(): string {
    return this.config.get<string>('dbenv', 'prelive0.dbo');
  }
 get schema(): string {
    return this.config.get<string>('DB_SCHEMA', 'prelive0.dbo');
  }

  private getConnectionConfig(): sql.config {
    return {
      server: this.config.get<string>('DB_SERVER', 'localhost'),
      port: Number(this.config.get<string>('DB_PORT', '1433')),
      user: this.config.get<string>('DB_USER', ''),
      password: this.config.get<string>('DB_PASSWORD', ''),
      database: this.config.get<string>('DB_NAME', 'prelive0'),
      options: {
        encrypt: this.config.get<string>('DB_ENCRYPT', 'false') === 'true',
        trustServerCertificate: true,
      },
    };
  }

  async getPool(): Promise<sql.ConnectionPool> {
    if (!this.poolPromise) {
      this.poolPromise = new sql.ConnectionPool(this.getConnectionConfig()).connect();
    }
    return this.poolPromise;
  }

  async query<T = unknown>(
    configure: (request: sql.Request) => sql.Request,
    query: string,
  ): Promise<sql.IResult<T>> {
    const pool = await this.getPool();
    const request = configure(pool.request());
    return request.query<T>(query);
  }
}
