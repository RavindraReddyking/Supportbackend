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

  /**
   * Search both:
   * current day index
   * previous day index
   *
   * because some logs are delayed
   * and stored in previous day index
   */
  private getCasinoIndexes(
    date: string,
  ): string[] {
    const logDate = new Date(date);

    const current = new Date(logDate);

    const previous = new Date(logDate);

    previous.setUTCDate(
      previous.getUTCDate() - 1,
    );

    const format = (d: Date) => {
      const yyyy = d.getUTCFullYear();

      const mm = String(
        d.getUTCMonth() + 1,
      ).padStart(2, '0');

      const dd = String(
        d.getUTCDate(),
      ).padStart(2, '0');

      return `filebeat-casino-${yyyy}.${mm}.${dd}*`;
    };

    return [
      format(previous),
      format(current),
    ];
  }

  private async searchFilebeatLogs(params: {
    query: string;
    from: string;
    to: string;
    size?: number;
    index?: string | string[];
  }) {
    const index = Array.isArray(
      params.index,
    )
      ? params.index.join(',')
      : params.index ||
        this.INDEX.ALL;

    const traceId = Math.random()
      .toString(36)
      .substring(2, 8);

    const start = Date.now();

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

    this.logger.log(
      `[${traceId}] ES START | idx=${index} | size=${body.size} | qlen=${params.query.length}`,
    );

    try {
      const res = await axios.post(
        `${process.env.ES_HOST}/${index}/_search`,
        body,
        {
          headers: this.headers(),
          timeout: 120000,
        },
      );

      const time =
        Date.now() - start;

      const hits =
        res.data?.hits?.hits || [];

      this.logger.log(
        `[${traceId}] ES OK | time=${time}ms | hits=${hits.length} | es=${res.data?.took}ms`,
      );

      return hits.map((x: any) => ({
        _id: x._id,
        _index: x._index,
        ...x._source,
      }));
    } catch (error: any) {
      const time =
        Date.now() - start;

      this.logger.error(
        `[${traceId}] ES FAIL | time=${time}ms | ${error.message}`,
      );

      throw error;
    }
  }

  private buildQueries(
    gameId: string,
    userId: string,
  ) {
    const query1 = `(
      contextMap.userId:"${userId}" AND message:"${gameId}"
    )`;

    const query2 = `"${userId}" AND "Start WS Listener"`;

    const query3 = `(
      (
        message:"${gameId}" AND (
          message:"betsclosed"
          OR message:"betsopen"
          OR message:"startdealing"
          OR message:"gr"
          OR message:"crashGameResult"
          OR message:"card"
          OR message:"decisioninc"
          OR message:"decision"
        )
      )
      OR
      (
        message:"${gameId}" AND message:"${userId}"
      )
    )
    AND NOT message:"JavaFX Application Thread"
    AND NOT message:"Hash calculation"`;

    return [query1, query2, query3];
  }

  private async runGameQueries(
    params: any,
  ) {
    const gameId = this.clean(
      params.gameId,
    );

    const userId = this.clean(
      params.userId,
    );

    const [q1, q2, q3] =
      this.buildQueries(
        gameId,
        userId,
      );

    const casinoIndexes =
      this.getCasinoIndexes(
        params.from,
      );

    this.logger.log(
      `[GAMELOGS] Using indexes=${casinoIndexes.join(
        ',',
      )} | gameId=${gameId} | userId=${userId}`,
    );

    const [res1, res2, res3] =
      await Promise.all([
        this.searchFilebeatLogs({
          query: q1,
          from: params.from,
          to: params.to,
          index: casinoIndexes,
        }),

        this.searchFilebeatLogs({
          query: q2,
          from: params.from,
          to: params.to,
          index: casinoIndexes,
        }),

        this.searchFilebeatLogs({
          query: q3,
          from: params.from,
          to: params.to,
          size: 3000,
          index: casinoIndexes,
        }),
      ]);

    // combine all
    const combined = [
      ...res1,
      ...res2,
      ...res3,
    ];

    // remove duplicates
    const uniqueMap = new Map();

    for (const item of combined) {
      uniqueMap.set(item._id, item);
    }

    // sort by timestamp
    return Array.from(
      uniqueMap.values(),
    ).sort(
      (a: any, b: any) =>
        new Date(
          a['@timestamp'],
        ).getTime() -
        new Date(
          b['@timestamp'],
        ).getTime(),
    );
  }

  async searchGenericGameLogs(
    params: any,
  ) {
    this.logger.log(
      `[GENERIC] ${params.gameId} | ${params.userId}`,
    );

    return this.runGameQueries(
      params,
    );
  }

  async searchOtherGameLogs(
    params: any,
  ) {
    this.logger.log(
      `[OTHER] ${params.gameId} | ${params.userId}`,
    );

    return this.runGameQueries(
      params,
    );
  }

  async searchBlackjackGameLogs(
    params: any,
  ) {
    this.logger.log(
      `[BLACKJACK] ${params.gameId} | ${params.userId}`,
    );

    return this.runGameQueries(
      params,
    );
  }

  async searchBaccaratGameLogs(
    params: any,
  ) {
    this.logger.log(
      `[BACCARAT] ${params.gameId} | ${params.userId}`,
    );

    return this.runGameQueries(
      params,
    );
  }

  async searchCrashGameLogs(
    params: any,
  ) {
    this.logger.log(
      `[CRASH] ${params.gameId} | ${params.userId}`,
    );

    return this.runGameQueries(
      params,
    );
  }

  async searchLateBetLogs(
    params: any,
  ) {
    const gameId = this.clean(
      params.gameId,
    );

    const userId = this.clean(
      params.userId,
    );

    const casinoIndexes =
      this.getCasinoIndexes(
        params.from,
      );

    this.logger.log(
      `[LATEBET] ${gameId} | ${userId} | idx=${casinoIndexes.join(
        ',',
      )}`,
    );

    return this.searchFilebeatLogs({
      query: `"ERROR : 1007 - LATE BET" AND "${gameId}" AND "${userId}"`,
      from: params.from,
      to: params.to,
      size: 500,
      index: casinoIndexes,
    });
  }

  async searchRoundLogs(
    params: any,
  ) {
    const roundId = this.clean(
      params.roundId,
    );

    this.logger.log(
      `[ROUND] ${roundId}`,
    );

    return this.searchFilebeatLogs({
      query: `"${roundId}"`,
      from: params.from,
      to: params.to,
      size: 3000,
      index: this.INDEX.ALL,
    });
  }
}