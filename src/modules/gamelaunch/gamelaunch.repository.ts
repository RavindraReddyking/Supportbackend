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
 private getIndexes3Days(
  from: string,
  to: string,
): string[] {
  const start = new Date(from);
  const end = new Date(to);

  start.setUTCDate(
    start.getUTCDate() - 1,
  );

  const indexes: string[] = [];

  const current = new Date(start);

  while (current <= end) {
    const yyyy =
      current.getUTCFullYear();

    const mm = String(
      current.getUTCMonth() + 1,
    ).padStart(2, '0');

    const dd = String(
      current.getUTCDate(),
    ).padStart(2, '0');

    indexes.push(
      `filebeat-*${yyyy}.${mm}.${dd}*`,
    );

    current.setUTCDate(
      current.getUTCDate() + 1,
    );
  }

  return indexes;
}

//Index for prleive//
private getFilebeatIndex(
  from: string,
  to: string,
): string | string[] {
  const isPrelive =
    process.env.NODE_ENV === 'prelive';

    console.log(
  'NODE_ENV:',
  process.env.NODE_ENV,
);

  if (isPrelive) {
    return 'filebeat-*';
  }

  return this.getIndexes3Days(
    from,
    to,
  );
}

//temporay fix//
private getDbEnv(): string {
  const env =
    process.env.NODE_ENV?.toLowerCase() === 'prelive'
      ? 'prelive0.dbo'
      : 'live.dbo';

  console.log(
    'DB ENV RESOLVED:',
    process.env.NODE_ENV,
    '=>',
    env,
  );

  return env;
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
    index?: string | string[];
  },
)
  {
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
const index = Array.isArray(
  params.index,
)
  ? params.index.join(',')
  : params.index;
  const maxAttempts = 5;

for (
  let attempt = 1;
  attempt <= maxAttempts;
  attempt++
) {
  let timeout = 7000;

  if (attempt === 5) {
    timeout = 65000;
  }

  try {
    console.log(
      'ES INDEXES:',
      index,
    );

    console.log(
      'ES ATTEMPT:',
      attempt,
      '| TIMEOUT:',
      timeout,
    );

    const searchStart =
      Date.now();

    const res = await axios.post(
      `${process.env.ES_HOST}/${index}/_search`,
      body,
      {
        headers: this.headers(),
        timeout,
      },
    );

    console.log(
      'ES SEARCH TIME:',
      Date.now() - searchStart,
      'ms',
    );

    console.log(
      'ES TOOK:',
      res.data?.took,
      'ms',
    );

    const hits =
      res.data?.hits?.hits || [];

    console.log(
      'ES HITS:',
      hits.length,
    );

    return hits.map((x: any) => ({
      _id: x._id,
      _index: x._index,
      ...x._source,
    }));
  } catch (error: any) {
    console.log(
      'ES ATTEMPT FAILED:',
      attempt,
      error?.message,
    );

    if (
      attempt === maxAttempts
    ) {
      this.logger.error(
        error?.response?.data ||
          error?.message,
      );

      throw error;
    }

    await new Promise((r) =>
      setTimeout(r, 1000),
    );
  }
}
  }

  // =====================================================
  // PLATFORM GAME DETAILS
  // =====================================================

  async getCasinoDetails(casinoId: string) {
const dbenv = this.getDbEnv();
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
  c.casino_desc,
  e.login,
  e.name AS env,
  owc.UCID
FROM ${dbenv}.OneWalletCasino owc WITH (NOLOCK)

INNER JOIN ${dbenv}.environment e WITH (NOLOCK)
  ON e.env_id = owc.env

LEFT JOIN ${dbenv}.casino c WITH (NOLOCK)
  ON c.casino_id = owc.casino_id

WHERE owc.casino_id = @CasinoId
      `,
    );
  }

  // =====================================================
  // TABLE CONFIG
  // =====================================================

  async getTableConfig(operatorGameId: string) {
const dbenv = this.getDbEnv();
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
  //Falback for missing tablename//
async getDistinctTableConfig(
  operatorGameIds: string[],
) {
const dbenv = this.getDbEnv();
  const gameIds = operatorGameIds
    .map((x) => `'${x}'`)
    .join(',');
return this.database.query(
  (request) => {
    return request;
  },
  `SELECT DISTINCT
    operator_game_id,
    table_name,
    table_id
FROM ${dbenv}.tableconfig WITH (NOLOCK)
WHERE operator_game_id IN (${gameIds})
ORDER BY operator_game_id
  `,
);
}

//To get All Chroma//
async getTableFamily(operatorGameId: string) {
const dbenv = this.getDbEnv();
  return this.database.query(
    (request) =>
      request.input(
        'OperatorGameId',
        sql.VarChar(50),
        operatorGameId,
      ),

    `
WITH table_family AS (
    SELECT
        table_name,
        table_id,
        operator_game_id,
        ROW_NUMBER() OVER (
            PARTITION BY operator_game_id
            ORDER BY table_id
        ) AS rn
    FROM ${dbenv}.tableconfig WITH (NOLOCK)
)
SELECT
    table_name,
    table_id,
    operator_game_id
FROM table_family
WHERE rn = 1
AND
    LEFT(
        operator_game_id,
        PATINDEX('%[^0-9]%', operator_game_id + 'A') - 1
    )
    =
    LEFT(
        @OperatorGameId,
        PATINDEX('%[^0-9]%', @OperatorGameId + 'A') - 1
    )
ORDER BY operator_game_id
    `,
  );
}

// For Multiple Game Family search in Token//
async getTableFamilies(
  operatorGameIds: string[],
) {
const dbenv = this.getDbEnv();
  const whereClause = operatorGameIds
    .map(
      (_, index) =>
        `operator_game_id LIKE @id${index}`,
    )
    .join(' OR ');

  return this.database.query(
    (request) => {
      operatorGameIds.forEach(
        (id, index) => {
          const familyId =
            id.match(/^\d+/)?.[0] || id;

          request.input(
            `id${index}`,
            sql.VarChar(50),
            `${familyId}%`,
          );
        },
      );

      return request;
    },

    `
SELECT DISTINCT
    operator_game_id,
    table_name,
    table_id
FROM ${dbenv}.tableconfig WITH (NOLOCK)
WHERE ${whereClause}
ORDER BY operator_game_id
    `,
  );
}

// For Multiple Gameid's search in Token//
async getTableConfigs(
  casinoId: string,
  operatorGameIds: string[],
) {
const dbenv = this.getDbEnv();
  const ids = operatorGameIds
    .map((_, index) => `@id${index}`)
    .join(',');
return this.database.query(
  (request) => {
    request.input(
      'CasinoId',
      sql.VarChar(50),
      casinoId,
    );

    operatorGameIds.forEach(
      (id, index) => {
        request.input(
          `id${index}`,
          sql.VarChar(50),
          id,
        );
      },
    );

    return request;
  },
    `
SELECT DISTINCT
    table_name,
    table_id,
    operator_game_id
FROM ${dbenv}.tableconfig WITH (NOLOCK)
WHERE operator_game_id IN (${ids})
  AND casino_id = @CasinoId
ORDER BY operator_game_id
    `,
  );
}

  // =====================================================
  // CASINO USER DETAILS
  // =====================================================

  async findCasinoUsers(styleName: string) {
const dbenv = this.getDbEnv();
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

  const encodedToken =
    encodeURIComponent(params.token);
    
console.log(
  'TOKEN:',
  params.token,
);

console.log(
  'ENCODED TOKEN:',
  encodedToken,
);


  const finalQuery = `
    (
      "${encodedToken}"
    )
    AND
    "processRequest GET query string"
  `;

  
const indexes =
  this.getFilebeatIndex(
    params.from,
    params.to,
  );

  return this.searchFilebeatLogs({
    query: finalQuery,
    from: params.from,
    to: params.to,
    size: 3000,
    index: indexes,
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

    
const indexes =
  this.getFilebeatIndex(
    params.from,
    params.to,
  );

    return this.searchFilebeatLogs({
      query: `UUID_SEARCH=${params.uuid}`, // ✅ triggers DSL
      from: params.from,
      to: params.to,
      size: 3000,
      index: indexes,
    });
  }

  //Get casino using stylename//
  async findCasinoByStyleNameAndEnv(
  styleName: string,
  ppenv: string,
) {
  const dbenv = this.getDbEnv();

  return this.database.query(
    (request) =>
      request
        .input(
          'StyleName',
          sql.VarChar(255),
          styleName,
        )
        .input(
          'Ppenv',
          sql.VarChar(50),
          ppenv,
        ),

    `
SELECT
    owc.casino_id,
    e.name AS ppenv
FROM ${dbenv}.casinouser c WITH (NOLOCK)
INNER JOIN ${dbenv}.OneWalletCasino owc WITH (NOLOCK)
    ON c.casino_id = owc.casino_id
INNER JOIN ${dbenv}.environment e WITH (NOLOCK)
    ON e.env_id = owc.env
WHERE c.email_address = @StyleName
  AND e.name = @Ppenv
    `,
  );
}

//Get LC Blocked countries//
async getLcBlockedCountries(
  operatorGameIds: string[],
) {
const dbenv = this.getDbEnv();
  const ids = operatorGameIds
    .map((_, index) => `@id${index}`)
    .join(',');

  return this.database.query(
    (request) => {
      operatorGameIds.forEach(
        (id, index) => {
          request.input(
            `id${index}`,
            sql.VarChar(50),
            id,
          );
        },
      );

      return request;
    },

    `
SELECT DISTINCT
    tc.operator_game_id,
    c.name,
    g.country_code
FROM ${dbenv}.GameTable_Country_Block_Map g WITH (NOLOCK)
INNER JOIN ${dbenv}.tableconfig tc WITH (NOLOCK)
    ON tc.table_id = g.table_id
INNER JOIN ${dbenv}.country c WITH (NOLOCK)
    ON c.country_code = g.country_code
WHERE tc.operator_game_id IN (${ids})
    `,
  );
}

//merged lobby config erorrs//
async searchCasinoMappingErrors(params: {
  ucId: string;
  from: string;
  to: string;
}) {

  const body = {
    size: 1000,

    sort: [
      {
        '@timestamp': {
          order: 'asc',
        },
      },
    ],

    query: {
      bool: {
        must: [],
        filter: [
          {
            match_phrase: {
              'contextMap.apiType':
                'unified-lobby-v2',
            },
          },
          {
            match_phrase: {
              'contextMap.ucId':
                params.ucId,
            },
          },
          {
            match_phrase: {
              message:
                'No casino Mapping found for ucId:',
            },
          },
          {
            range: {
              '@timestamp': {
                gte: params.from,
                lte: params.to,
              },
            },
          },
        ],
        should: [],
        must_not: [],
      },
    },
  };
const maxAttempts = 3;

let res: any;

const index =
  process.env.NODE_ENV === 'prelive'
    ? 'filebeat-*'
    : 'filebeat-live-*';

for (
  let attempt = 1;
  attempt <= maxAttempts;
  attempt++
) {
  let timeout = 7000;

  if (attempt === 3) {
    timeout = 25000;
  }

  try {
    res = await axios.post(
  `${process.env.ES_HOST}/${index}/_search`,
  body,
  {
    headers: this.headers(),
    timeout,
  },
);

    break;
  } catch (error: any) {
    console.log(
      'CASINO_MAPPING_SEARCH FAILED:',
      attempt,
      error?.message,
    );

    if (attempt === maxAttempts) {
      throw error;
    }

    await new Promise((r) =>
      setTimeout(r, 1000),
    );
  }
}
return (
  res.data?.hits?.hits || []
).map((x: any) => ({
  _id: x._id,
  _index: x._index,
  ...x._source,
}));
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

  console.log(
    'TOKEN QUERY:',
    finalQuery,
  );

  const indexes =
    this.getFilebeatIndex(
      params.from,
      params.to,
    );

  return this.searchFilebeatLogs({
    query: finalQuery,
    from: params.from,
    to: params.to,
    size: 5000,
    index: indexes,
  });
}
}