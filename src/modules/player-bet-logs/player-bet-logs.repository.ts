import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PlayerBetLogsRepository {
  private logger = new Logger(PlayerBetLogsRepository.name);

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
  }) {
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
      const res = await axios.post(process.env.KIBANA_URL!, body, {
        headers: this.headers(),
        timeout: 65000,
      });

      return res.data?.hits?.hits?.map((x: any) => x._source) || [];
    } catch (error: any) {
      this.logger.error('Kibana query failed', {
        query: params.query,
        message: error.message,
        response: error?.response?.data,
      });
      throw error;
    }
  }

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
    )`;

    return this.searchFilebeatLogs({
      query,
      from: params.from,
      to: params.to,
    });
  }

  async searchBlackjackGameLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

    const query = `(
      ("${gameId}" AND "${userId}" AND "INCOMING message: <command channel=")
      OR
      ("${gameId}" AND timeout AND "On message")
      OR
      ("${gameId}" AND meta AND (decision OR decisioninc OR card))
      OR
      ("${userId}" AND "error-1007")
      OR
      ("${gameId}" AND ("betsclosed" OR "betsopen" OR "startdealing"))
      OR
      ("${userId}" AND "Start WS Listener")
    )`;

    return this.searchFilebeatLogs({
      query,
      from: params.from,
      to: params.to,
      size: 3000,
    });
  }

  async searchBaccaratGameLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

    const query1 = `(
      "${gameId}" AND "${userId}"
    ) OR (
      "${gameId}" AND ("betsclosed" OR "betsopen" OR "startdealing")
    ) OR (
      "${userId}" AND "Start WS Listener"
    )`;

    const query2 = `"${gameId}" AND card`;

    const [res1, res2] = await Promise.all([
      this.searchFilebeatLogs({
        query: query1,
        from: params.from,
        to: params.to,
      }),
      this.searchFilebeatLogs({
        query: query2,
        from: params.from,
        to: params.to,
      }),
    ]);

    return [...res1, ...res2];
  }

  async searchCrashGameLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

    const extraQuery = `(
      contextMap.userId:"${userId}"
      OR
      ("${gameId}" AND ("betsclosed" OR "betsopen" OR "startdealing"))
      OR
      ("${userId}" AND "Start WS Listener")
      OR
      ("${gameId}" AND "${userId}" AND "Cashout Request info")
    )`;

    return this.searchFilebeatLogs({
      query: `"${gameId}"`,
      from: params.from,
      to: params.to,
      size: 3000,
      extraFilters: [
        {
          query_string: { query: extraQuery },
        },
      ],
    });
  }

  async searchLateBetLogs(params: {
    gameId: string;
    userId: string;
    from: string;
    to: string;
  }) {
    const gameId = this.clean(params.gameId);
    const userId = this.clean(params.userId);

    const query = `"ERROR : 1007 - LATE BET" AND "${gameId}" AND "${userId}"`;

    return this.searchFilebeatLogs({
      query,
      from: params.from,
      to: params.to,
      size: 500,
    });
  }

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
    });
  }
}