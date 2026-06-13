import { Injectable } from '@nestjs/common';
import * as sql from 'mssql';

import { DatabaseService } from '../../database/database.service';

@Injectable()
export class GameLaunchRepository {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async getCasinoDetails(casinoId: string) {
    const dbenv = process.env.DBENV;

    return this.database.query(
      (request) =>
        request.input(
          'CasinoId',
          sql.VarChar(16),
          casinoId,
        ),

      `
        SELECT TOP 1
          owc.casino_id,
          e.login,
          e.name AS env,
          owc.UCID
        FROM ${dbenv}.OneWalletCasino owc WITH (NOLOCK)
        INNER JOIN ${dbenv}.environment e WITH (NOLOCK)
          ON e.env_id = owc.env
        WHERE owc.casino_id = @CasinoId
      `,
    );
  }
}