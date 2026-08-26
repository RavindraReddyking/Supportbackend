import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PlayerBetLogsRepository {
  private logger = new Logger(
    PlayerBetLogsRepository.name,
  );

  private readonly INDEX = {
    ALL: 'filebeat-*',
  };

  private headers() {
    return {
      'Content-Type': 'application/json',
      Accept: '*/*',
      'kbn-xsrf': 'true',
      Authorization: `ApiKey ${process.env.KIBANA_API_KEY}`,
    };
  }

  private clean(value: string) {
    return value?.trim();
  }

  private getCasinoIndexes(date: string): string[] {
    const logDate = new Date(date);

    const current = new Date(logDate);
    const previous = new Date(logDate);

    previous.setUTCDate(previous.getUTCDate() - 1);

    const format = (d: Date) => {
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `filebeat-casino-${yyyy}.${mm}.${dd}*`;
    };

    return [format(previous), format(current)];
  }

private getCasinoIndexesByEnv(
  date: string,
): string | string[] {
  if (
    process.env.NODE_ENV === 'prelive'
  ) {
    return 'filebeat-*';
  }

  return this.getCasinoIndexes(
    date,
  );
}

  private getRoundIndexes3Days(from: string, to: string, prefix: string): string[] {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const prevDate = new Date(fromDate);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);

    const format = (d: Date) => {
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${prefix}-${yyyy}.${mm}.${dd}*`;
    };

    return Array.from(new Set([
      format(prevDate),
      format(fromDate),
      format(toDate),
    ]));
  }

  private async searchFilebeatLogs(params: {
    query?: string;
    from: string;
    to: string;
    size?: number;
    index?: string | string[];
    bodyOverride?: any;
  }) {
    const index = Array.isArray(params.index)
      ? params.index.join(',')
      : params.index || this.INDEX.ALL;

    const body = params.bodyOverride ?? {
      size: params.size ?? 2000,
      sort: [{ '@timestamp': { order: 'asc' } }],
      _source: [
        '@timestamp',
        'message',
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
        'app_proc_time',
        'contextMap',
        'level',
        'thrown.extendedStackTrace',
      ],
      query: {
        bool: {
          must: [
            {
              query_string: {
                query: params.query,
                default_operator: 'AND',
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

    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let timeout = 7000;
      if (attempt === 4) timeout = 20000;

      try {
        const res = await axios.post(
          `${process.env.ES_HOST}/${index}/_search`,
          body,
          {
            headers: this.headers(),
            timeout,
          },
        );

        const hits = res.data?.hits?.hits || [];

        return hits.map((x: any) => ({
          _id: x._id,
          _index: x._index,
          ...x._source,
        }));
      } catch (error: any) {
        if (attempt === maxAttempts) {
          return [];
        }

        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  private buildQueries(gameId: string, userId: string) {
    const query1 = `contextMap.userId:"${userId}" AND message:"${gameId}"`;
    const query2 = `"${userId}" AND "Start WS Listener"`;
    const query3 = `( ( message:"${gameId}" AND ( message:"betsclosed" OR message:"betsopen" OR message:"startdealing" OR message:"gr" OR message:"crashGameResult" OR message:"card" OR message:"decisioninc" OR message:"decision" ) ) OR ( message:"${gameId}" AND message:"${userId}" ) )`;
    const query4 = `level:"ERROR" AND contextMap.userId:"${userId}" AND contextMap.gameId:"${gameId}"`;

    return [query1, query2, query3, query4];
  }
private async runGameQueries(params: any) {
 
  const startTime = Date.now();

  const gameId = this.clean(params.gameId);
  const userId = this.clean(params.userId);

const casinoIndexes =
  this.getCasinoIndexesByEnv(
    params.from,
  );

  const results = await Promise.all([

    
    // ✅ Query 1
    this.searchFilebeatLogs({
      from: params.from,
      to: params.to,
      index: casinoIndexes,
      bodyOverride: {
        size: 2000,
        sort: [{ '@timestamp': { order: 'asc' } }],
        query: {
          bool: {
            filter: [
              { match_phrase: { "contextMap.userId": userId } },
              { match_phrase: { "message": gameId } },
              {
                range: {
                  "@timestamp": {
                    gte: params.from,
                    lte: params.to,
                  },
                },
              },
            ],
          },
        },
      },
    }),

    // ✅ Query 2
    this.searchFilebeatLogs({
      from: params.from,
      to: params.to,
      index: casinoIndexes,
      bodyOverride: {
        size: 2000,
        sort: [{ '@timestamp': { order: 'asc' } }],
        query: {
          bool: {
            filter: [
              { match_phrase: { "message": userId } },
              { match_phrase: { "message": "Start WS Listener" } },
              {
                range: {
                  "@timestamp": {
                    gte: params.from,
                    lte: params.to,
                  },
                },
              },
            ],
          },
        },
      },
    }),

    // ✅ Query 3 (complex)
   this.searchFilebeatLogs({
  from: params.from,
  to: params.to,
  index: casinoIndexes,
  bodyOverride: {
    size: 3000,
    sort: [{ '@timestamp': { order: 'asc' } }],
    query: {
      bool: {
        filter: [
          { match_phrase: { "message": gameId } },
          {
            bool: {
              should: [
                { match_phrase: { "message": "betsclosed" } },
                { match_phrase: { "message": "betsopen" } },
                { match_phrase: { "message": "startdealing" } },
                { match_phrase: { "message": "gr" } },
                { match_phrase: { "message": "crashGameResult" } },
                { match_phrase: { "message": "card" } },
                { match_phrase: { "message": "decisioninc" } },
                { match_phrase: { "message": "decision" } },
              ],
              minimum_should_match: 1
            },
          },
          {
            range: {
              "@timestamp": {
                gte: params.from,
                lte: params.to,
              },
            },
          },
        ],
      },
    },
  },
}),
    // ✅ Query 4 (ERROR logs)
    this.searchFilebeatLogs({
      from: params.from,
      to: params.to,
      index: casinoIndexes,
      bodyOverride: {
        size: 1000,
        sort: [{ '@timestamp': { order: 'asc' } }],
        query: {
          bool: {
            filter: [
              { match_phrase: { "level": "ERROR" } },
              { match_phrase: { "contextMap.userId": userId } },
              { match_phrase: { "contextMap.gameId": gameId } },
              {
                range: {
                  "@timestamp": {
                    gte: params.from,
                    lte: params.to,
                  },
                },
              },
            ],
          },
        },
      },
    }),

  //Query 5//

  this.searchFilebeatLogs({
  from: params.from,
  to: params.to,
  index: casinoIndexes,
  bodyOverride: {
    size: 2000,
    sort: [{ '@timestamp': { order: 'asc' } }],
    query: {
      bool: {
        filter: [
          { match_phrase: { "message": gameId } },
          { match_phrase: { "message": userId } },
          {
            range: {
              "@timestamp": {
                gte: params.from,
                lte: params.to,
              },
            },
          },
        ],
      },
    },
  },
}),
 
  // Query 6
this.searchFilebeatLogs({
  from: params.from,
  to: params.to,
  index: casinoIndexes,
  bodyOverride: {
    size: 2000,
    sort: [{ '@timestamp': { order: 'asc' } }],
    query: {
      bool: {
        filter: [
          { match_phrase: { "contextMap.gameId": gameId } },
          { match_phrase: { "message": userId } },
          {
            match_phrase: {
              "message": "timeout setting wants card action"
            }
          },
          {
            range: {
              "@timestamp": {
                gte: params.from,
                lte: params.to,
              },
            },
          },
        ],
      },
    },
  },
})
 ]);

  // ✅ Merge + dedupe
  const combined = results.flat();

  const uniqueMap = new Map();
  combined.forEach(item => uniqueMap.set(item._id, item));

  const result = Array.from(uniqueMap.values()).sort(
    (a: any, b: any) =>
      new Date(a['@timestamp']).getTime() -
      new Date(b['@timestamp']).getTime(),
  );

  this.logger.log(`[GAME] TOTAL TIME = ${Date.now() - startTime} ms`);

  return result;
}

  async searchGenericGameLogs(params: any) {
    return this.runGameQueries(params);
  }

  async searchOtherGameLogs(params: any) {
    return this.runGameQueries(params);
  }

  async searchBlackjackGameLogs(params: any) {
    return this.runGameQueries(params);
  }

  async searchBaccaratGameLogs(params: any) {
    return this.runGameQueries(params);
  }

  async searchCrashGameLogs(params: any) {
    return this.runGameQueries(params);
  }

  async searchLateBetLogs(params: any) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

const casinoIndexes =
  this.getCasinoIndexesByEnv(
    params.from,
  );

    return this.searchFilebeatLogs({
      query: `"ERROR : 1007 - LATE BET" AND "${gameId}" AND "${userId}"`,
      from: params.from,
      to: params.to,
      size: 500,
      index: casinoIndexes,
    });
  }

  async searchRoundLogs(params: any) {
    const startTime = Date.now();

    const roundId = this.clean(params.roundId);

    const gameApiIndexes =
  process.env.NODE_ENV === 'prelive'
    ? ['filebeat-*']
    : [
        ...this.getRoundIndexes3Days(
          params.from,
          params.to,
          'filebeat-casino',
        ),
        ...this.getRoundIndexes3Days(
          params.from,
          params.to,
          'filebeat-live',
        ),
      ];

   const slotsIndexes =
  process.env.NODE_ENV === 'prelive'
    ? ['filebeat-slots-*']
    : this.getRoundIndexes3Days(
        params.from,
        params.to,
        'filebeat-slots',
      );

    const fromDate = new Date(params.from);
    const now = new Date();
    const diffDays =
      (now.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

    const gameApiPromise = this.searchFilebeatLogs({
      from: params.from,
      to: params.to,
      index: gameApiIndexes,
      bodyOverride: {
        size: 3000,
        sort: [{ '@timestamp': { order: 'asc' } }],
        query: {
          bool: {
            filter: [
              { match_phrase: { message: 'gameapi' } },
              { match_phrase: { message: 'Request' } },
              { match_phrase: { message: roundId } },
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
      },
    });

    let slotPromise: Promise<any[]> = Promise.resolve([]);

    if (diffDays <= 9) {
      slotPromise = this.searchFilebeatLogs({
        from: params.from,
        to: params.to,
        index: slotsIndexes,
        bodyOverride: {
          size: 3000,
          query: {
            bool: {
              filter: [
                { match_phrase: { message: roundId } },
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
        },
      });
    }

    const [gameApiLogs, slotLogs] = await Promise.all([
      gameApiPromise,
      slotPromise,
    ]);

    const combined = [...gameApiLogs, ...slotLogs];

    const map = new Map();
    combined.forEach((x) => map.set(x._id, x));

    const result = Array.from(map.values()).sort(
      (a, b) =>
        new Date(a['@timestamp']).getTime() -
        new Date(b['@timestamp']).getTime()
    );

    this.logger.log(`[ROUND] TOTAL TIME = ${Date.now() - startTime} ms`);

    return result;
  }
}