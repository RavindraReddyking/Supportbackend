import { Injectable } from '@nestjs/common';
import * as sql from 'mssql';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class PlayerBetsRepository {
  constructor(private readonly database: DatabaseService) {}

  async getPlayerBets(playerId: string, fromDate: Date, toDate: Date) {
    const schema = this.database.schema;

    const result = await this.database.query(
      (request) =>
        request
          .input('UserId', sql.VarChar(16), playerId.padEnd(16, ' '))
          .input('StartTime', sql.DateTime2, fromDate)
          .input('EndTime', sql.DateTime2, toDate),
      `
        EXEC ${schema}.usp_PlayerBets
          @UserId = @UserId,
          @StartTime = @StartTime,
          @EndTime = @EndTime
      `,
    );

    return result;
  }
}
