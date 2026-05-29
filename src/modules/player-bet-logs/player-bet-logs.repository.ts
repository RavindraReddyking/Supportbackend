import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PlayerBetLogsRepository {
  private logger = new Logger(PlayerBetLogsRepository.name);

  // ✅ INDEX CONSTANTS
  private readonly INDEX = {
    ALL: 'filebeat-*',
    CASINO: 'filebeat-casino-*',
  };

  private headers() {
    return {
      'Content-Type': 'application/json',
      Accept: '*/*',
      'User-Agent': 'Mozilla/5.0',
      'kbn-xsrf': 'true',
      Authorization: `ApiKey ${process.env.KIBANA_API_KEY}`,
    };
  }

  private clean(value: string) {
    return value?.trim();
  }

  private async searchFilebeatLogs(params: {
    query: string;
    from: string;
    to: string;
    size?: number;
    extraFilters?: any[];
    index?: string; // ✅ NEW
  }) {
    const index = params.index || this.INDEX.ALL;

    const body = {
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
        'contextMap',
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
            ...(params.extraFilters ?? []),
          ],
        },
      },
    };
    try {
      const res = await axios.post(
        `${process.env.ES_HOST}/${index}/_search`, // ✅ KEY CHANGE
        body,
        {
          headers: this.headers(),
          timeout: 65000,
        },
      );

      return res.data?.hits?.hits?.map((x: any) => x._source) || [];
    } catch (error: any) {
      this.logger.error('Kibana query failed', {
        query: params.query,
        index,
        message: error.message,
        response: error?.response?.data,
      });
      throw error;
    }
  }

  // ✅ GENERIC
  async searchGenericGameLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

    const query = `(
      "${gameId}" AND "${userId}"
    ) OR (
      "${gameId}" AND ("betsclosed" OR "betsopen" OR "startdealing")
    ) OR (
      "${userId}" AND "Start WS Listener"
    ) OR (
      contextMap.userId:"${userId}" AND "${gameId}" AND "INCOMING"
    )
    OR (
      message:*${gameId}* AND message:*${userId}*
    ) OR (
      message:*gameid=${gameId}* AND message:*userid=${userId}*
    )`;

    return this.searchFilebeatLogs({
      query,
      from: params.from,
      to: params.to,
      index: this.INDEX.CASINO,
    });
  }

  // ✅ OTHER
  async searchOtherGameLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

    const query = `(
      "${gameId}" AND "${userId}"
    ) OR (
      "${gameId}" AND ("betsclosed" OR "betsopen" OR "startdealing")
    ) OR (
      "${userId}" AND "Start WS Listener"
    ) OR (
      contextMap.userId:"${userId}" AND "${gameId}" AND "INCOMING"
    )
    OR (
      message:*${gameId}* AND message:*${userId}*
    ) OR (
      message:*gameid=${gameId}* AND message:*userid=${userId}*
    )`;

    return this.searchFilebeatLogs({
      query,
      from: params.from,
      to: params.to,
      size: 3000,
      index: this.INDEX.CASINO,
    });
  }

  // ✅ BLACKJACK
  async searchBlackjackGameLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

    const query = `(your existing query unchanged)`;

    return this.searchFilebeatLogs({
      query,
      from: params.from,
      to: params.to,
      size: 3000,
      index: this.INDEX.CASINO,
    });
  }

  // ✅ BACCARAT
  async searchBaccaratGameLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);

    const query1 = `(your existing query unchanged)`;
    const query2 = `"${gameId}" AND card`;

    const [res1, res2] = await Promise.all([
      this.searchFilebeatLogs({
        query: query1,
        from: params.from,
        to: params.to,
        index: this.INDEX.CASINO,
      }),
      this.searchFilebeatLogs({
        query: query2,
        from: params.from,
        to: params.to,
        index: this.INDEX.CASINO,
      }),
    ]);

    return [...res1, ...res2];
  }

  // ✅ CRASH
  async searchCrashGameLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

    const query1 = `("${gameId}" AND contextMap.userId:"${userId}")`;
    const query2 = `(your existing query unchanged)`;

    const [res1, res2] = await Promise.all([
      this.searchFilebeatLogs({
        query: query1,
        from: params.from,
        to: params.to,
        size: 3000,
        index: this.INDEX.CASINO,
      }),
      this.searchFilebeatLogs({
        query: query2,
        from: params.from,
        to: params.to,
        size: 3000,
        index: this.INDEX.CASINO,
      }),
    ]);

    return [...res1, ...res2];
  }

  // ✅ LATE BET
  async searchLateBetLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

    return this.searchFilebeatLogs({
      query: `"ERROR : 1007 - LATE BET" AND "${gameId}" AND "${userId}"`,
      from: params.from,
      to: params.to,
      size: 500,
      index: this.INDEX.CASINO,
    });
  }

  // ✅ ✅ ROUND LOGS (ONLY FULL INDEX)
  async searchRoundLogs(params: {
    roundId: string;
    from: string;
    to: string;
  }) {
    const roundId = this.clean(params.roundId);

    return this.searchFilebeatLogs({
      query: `"${roundId}"`,
      from: params.from,
      to: params.to,
      size: 3000,
      index: this.INDEX.ALL, // ✅ IMPORTANT
    });
  }
}
