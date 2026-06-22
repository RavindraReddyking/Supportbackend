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
      'Content-Type': 'application/json',
      Accept: '*/*',
      'kbn-xsrf': 'true',
      Authorization: `ApiKey ${process.env.KIBANA_API_KEY}`,
    };
  }

  // =====================================================
  // SEARCH FILEBEAT LOGS (✅ UPDATED WITH DSL SUPPORT)
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
    let esQuery;

    // ✅ UUID SPECIAL CASE (DSL)
    if (params.query.startsWith('UUID_SEARCH=')) {
      const uuid = params.query.replace(
        'UUID_SEARCH=',
        '',
      );

      esQuery = {
        match_phrase: {
          'contextMap.uuid:': uuid, // ✅ correct for your logs
        },
      };
    } else {
      // ✅ NORMAL FLOW (unchanged)
      esQuery = {
        query_string: {
          query: params.query,
          default_operator: 'AND',
        },
      };
    }

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
          must: [esQuery],

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

      return hits.map((x: any) => ({
        _id: x._id,
        _index: x._index,
        ...x._source,
      }));
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

  // =====================================================
  // TABLE CONFIG
  // =====================================================

  async getTableConfig(operatorGameId: string) {
    const dbenv = process.env.DBENV;

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

  async findCasinoUsers(styleName: string) {
    const dbenv = process.env.DBENV;

    return this.database.query(
      (request) =>
        request.input(
          'StyleName',
          sql.VarChar(255),
          styleName,
        ),

      `
SELECT DISTINCT
  cu.email_address,
  cu.casino_id,
  cu.active_flag,
  c.casino_desc
FROM ${dbenv}.casinouser cu WITH (NOLOCK)
INNER JOIN ${dbenv}.casino c WITH (NOLOCK)
  ON c.casino_id = cu.casino_id
WHERE cu.email_address = @StyleName
AND cu.usertype_code = 'SYST'
      `,
    );
  }

  // =====================================================
  // GAME LAUNCH LOGS (ENTRY SEARCH ✅)
  // =====================================================

  async searchGameLaunchLogs(params: {
    token: string;
    gameId: string;
    from: string;
    to: string;
  }) {
    this.logger.log(
      `[GAME_LAUNCH] token=${params.token} | gameId=${params.gameId}`,
    );

    const finalQuery = `
      "processRequest GET query string"
      AND "${params.token}"
    `;

    return this.searchFilebeatLogs({
      query: finalQuery,
      from: params.from,
      to: params.to,
      size: 3000,
      index: 'filebeat-*',
    });
  }

  // =====================================================
  // ✅ UUID SEARCH (FIXED ✅)
  // =====================================================

  async searchLogsByUUID(params: {
    uuid: string;
    from: string;
    to: string;
  }) {
    this.logger.log(
      `[UUID_SEARCH] uuid=${params.uuid}`,
    );

    return this.searchFilebeatLogs({
      query: `UUID_SEARCH=${params.uuid}`, // ✅ triggers DSL
      from: params.from,
      to: params.to,
      size: 3000,
      index: 'filebeat-*',
    });
  }

// =====================================================
// ✅ FULL TOKEN LOG SEARCH (NO QUERY STRING FILTER)
// =====================================================

async searchAllLogsByToken(params: {
  token: string;
  from: string;
  to: string;
}) {
  this.logger.log(
    `[TOKEN_FULL_SEARCH] token=${params.token}`,
  );

  const finalQuery = `"${params.token}"`;

  return this.searchFilebeatLogs({
    query: finalQuery,
    from: params.from,
    to: params.to,
    size: 5000, // ✅ more logs
    index: 'filebeat-*',
  });
}

}
