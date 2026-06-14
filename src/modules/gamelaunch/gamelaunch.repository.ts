import {
  Injectable,
  Logger,
} from '@nestjs/common';

import axios from 'axios';
import * as sql from 'mssql';

import { DatabaseService } from '../../database/database.service';

@Injectable()
export class GameLaunchRepository {
  private logger = new Logger(
    GameLaunchRepository.name,
  );

  constructor(
    private readonly database: DatabaseService,
  ) {}

  // =====================================================
  // ES HEADERS
  // =====================================================

  private headers() {
    return {
      'Content-Type':
        'application/json',

      Accept: '*/*',

      'kbn-xsrf': 'true',

      Authorization: `ApiKey ${process.env.KIBANA_API_KEY}`,
    };
  }

  // =====================================================
  // SEARCH FILEBEAT LOGS
  // =====================================================

  private async searchFilebeatLogs(
    params: {
      query: string;
      from: string;
      to: string;
      size?: number;
      index?: string;
    },
  ) {
    const body = {
      size: params.size ?? 2000,

      sort: [
        {
          '@timestamp': {
            order: 'asc',
          },
        },
      ],

      _source: [
        '@timestamp',
        'message',
        'app.casinoID',
        'app.game',
        'app',
        'service',
        'serviceName',
        'serviceMethod',
        'stage',
        'error',
        'responseLog',
        'requestLog',
        'log.level',
        'host',
        'host.name',
        'app_proc_time',
        'contextMap',
        'contextMap.casinoId',
        'contextMap.casinoName',
        'contextMap.ppenv',
        'contextMap.apiType',
        'contextMap.time',
        'contextMap.uuid',
      ],

      query: {
        bool: {
          must: [
            {
              query_string: {
                query: params.query,

                default_operator:
                  'AND',
              },
            },
          ],

          filter: [
            {
              range: {
                '@timestamp': {
                  gte: params.from,
                  lte: params.to,
                },
              },
            },
          ],
        },
      },
    };

    try {
      const res = await axios.post(
        `${process.env.ES_HOST}/${params.index}/_search`,
        body,
        {
          headers: this.headers(),

          timeout: 120000,
        },
      );

      const hits =
        res.data?.hits?.hits || [];

      return hits.map(
        (x: any) => ({
          _id: x._id,
          _index: x._index,
          ...x._source,
        }),
      );
    } catch (error: any) {
      this.logger.error(
        error?.response?.data ||
          error?.message,
      );

      throw error;
    }
  }

  // =====================================================
  // PLATFORM GAME DETAILS
  // =====================================================

  async getCasinoDetails(
    casinoId: string,
  ) {
    const dbenv =
      process.env.DBENV;

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

  // =====================================================
  // TABLE CONFIG
  // =====================================================

  async getTableConfig(
    operatorGameId: string,
  ) {
    const dbenv =
      process.env.DBENV;

    return this.database.query(
      (request) =>
        request.input(
          'OperatorGameId',
          sql.VarChar(50),
          operatorGameId,
        ),

      `
        SELECT TOP 1
          table_name,
          table_id,
          operator_game_id
        FROM ${dbenv}.tableconfig WITH (NOLOCK)
        WHERE operator_game_id = @OperatorGameId
      `,
    );
  }

  // =====================================================
  // CASINO USER DETAILS
  // =====================================================

  async findCasinoUsers(
    styleName: string,
  ) {
    const dbenv =
      process.env.DBENV;

    return this.database.query(
      (request) =>
        request.input(
          'StyleName',
          sql.VarChar(255),
          styleName,
        ),

      `
        SELECT DISTINCT
          email_address,
          casino_id,
          active_flag
        FROM ${dbenv}.casinouser WITH (NOLOCK)
        WHERE email_address = @StyleName
        AND usertype_code = 'SYST'
      `,
    );
  }

  // =====================================================
  // GAME LAUNCH LOGS
  // =====================================================

  async searchGameLaunchLogs(
    params: {
      token: string;
      gameId: string;
      from: string;
      to: string;
    },
  ) {
    this.logger.log(
      `[GAME_LAUNCH] token=${params.token} | gameId=${params.gameId}`,
    );

    const finalQuery = `
      "${params.token}"
    `;

    const logs =
      await this.searchFilebeatLogs({
        query: finalQuery,

        from: params.from,

        to: params.to,

        size: 3000,

        index: 'filebeat-*',
      });

    return logs;
  }
}