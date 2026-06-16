import {
  Injectable,
  Logger,
} from '@nestjs/common';

import axios from 'axios';

@Injectable()
export class GameTraceRepository {
  private logger = new Logger(
    GameTraceRepository.name,
  );

  private headers() {
    return {
      'Content-Type': 'application/json',
      Accept: '*/*',
      'kbn-xsrf': 'true',
      Authorization: `ApiKey ${process.env.KIBANA_API_KEY}`,
    };
  }

  /**
   * COMMON ELASTIC SEARCH
   */

  private async searchLogs(params: {
    index: string | string[];
    query: string;
    from: string;
    to: string;
    size?: number;
  }) {
    const index = Array.isArray(params.index)
      ? params.index.join(',')
      : params.index;

    const body = {
      size: params.size || 5000,

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
        'contextMap',
        'service',
        'host',
        'app',
        'error',
        'responseLog',
        'requestLog',
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

    const response = await axios.post(
      `${process.env.ES_HOST}/${index}/_search`,
      body,
      {
        headers: this.headers(),
        timeout: 120000,
      },
    );

    return (
      response.data?.hits?.hits?.map(
        (x: any) => ({
          _id: x._id,
          _index: x._index,
          ...x._source,
        }),
      ) || []
    );
  }

  /**
   * FAILED LOG DETECTION
   */

  private isFailedLog(
    log: any,
  ) {
    const data =
      JSON.stringify(log).toLowerCase();

    /**
     * error != 0
     */

    const errorMatch =
      data.match(
        /"error"\s*:\s*([0-9]+)/,
      );

    const hasNonZeroError =
      errorMatch &&
      Number(errorMatch[1]) !== 0;

    return (
      hasNonZeroError ||
      data.includes('"error":true') ||
      data.includes('"success":false') ||
      data.includes(
        '"status":"failed"',
      ) ||
      data.includes('exception') ||
      data.includes('failed') ||
      data.includes('timeout') ||
      data.includes('rejected') ||
      data.includes('unable') ||
      data.includes('invalid')
    );
  }

  /**
   * EXTRACT gameSessionIDs
   */

  private extractGameSessionIDs(
    logs: any[],
  ) {
    return [
      ...new Set(
        logs
          .map((log) => {
            const data =
              JSON.stringify(log);

            const match =
              data.match(
                /"gameSessionID":"([^"]+)"/,
              );

            return match?.[1];
          })
          .filter(Boolean),
      ),
    ];
  }

  /**
   * EXTRACT playSessionIDs
   */

  private extractPlaySessionIDs(
    logs: any[],
  ) {
    return [
      ...new Set(
        logs
          .map((log) => {
            const data =
              JSON.stringify(log);

            const match =
              data.match(
                /"playSessionID":([0-9]+)/,
              );

            return match?.[1];
          })
          .filter(Boolean),
      ),
    ];
  }

  async searchGameTrace(params: {
    ip: string;
    from: string;
    to: string;
    logType?: string;
  }) {
    /**
     * STEP 1
     * SEARCH RGSGateway USING IP
     */

    const gatewayQuery = `
"${params.ip}"
AND "RGSGateway"
`;

    const gatewayLogs =
      await this.searchLogs({
        index: 'filebeat-*',
        query: gatewayQuery,
        from: params.from,
        to: params.to,
        size: 5000,
      });

    /**
     * STEP 2
     * AUTHENTICATE LOGS
     */

    const authenticateLogs =
      gatewayLogs.filter((log: any) =>
        log.message?.includes(
          '/RGSGateway/UserAPI/authenticate',
        ),
      );

    /**
     * STEP 3
     * VERIFY LOGS
     */

    const verifyLogs =
      gatewayLogs.filter((log: any) =>
        log.message?.includes(
          '/RGSGateway/UserAPI/ticket/verify/',
        ),
      );

    /**
     * BT FLOW
     *
     * ONLY VERIFY LOGS
     */

    const isSW =
      authenticateLogs.length > 0;

    if (!isSW) {
      return {
        flowType: 'BT',

        searchedIP: params.ip,

        verifyLogs,
      };
    }

    /**
     * STEP 4
     * EXTRACT gameSessionIDs
     */

    const gameSessionIDs =
      this.extractGameSessionIDs(
        authenticateLogs,
      );

    /**
     * STEP 5
     * SEARCH CASINO LOGS
     */

    let casinoLogs: any[] = [];

    if (gameSessionIDs.length) {
      const casinoQuery = `
(
${gameSessionIDs
  .map((id) => `"${id}"`)
  .join(' OR ')}
)
AND
(
"/GameAPI/bet/"
OR "/GameAPI/win/"
OR "/GameAPI/adjustment/"
)
`;

      casinoLogs =
        await this.searchLogs({
          index: 'filebeat-casino-*',
          query: casinoQuery,
          from: params.from,
          to: params.to,
          size: 10000,
        });
    }

    /**
     * STEP 6
     * BET / WIN / ADJUSTMENT LOGS
     */

    let betLogs =
      casinoLogs.filter((log: any) =>
        log.message?.includes(
          '/GameAPI/bet/',
        ),
      );

    let winLogs =
      casinoLogs.filter((log: any) =>
        log.message?.includes(
          '/GameAPI/win/',
        ),
      );

    let adjustmentLogs =
      casinoLogs.filter((log: any) =>
        log.message?.includes(
          '/GameAPI/adjustment/',
        ),
      );

    /**
     * STEP 7
     * EXTRACT playSessionIDs
     */

    const playSessionIDs =
      this.extractPlaySessionIDs(
        casinoLogs,
      );

    /**
     * STEP 8
     * PLATFORM LOGS
     */

    let platformLogs: any[] = [];

    if (playSessionIDs.length) {
      const slotQuery =
        playSessionIDs
          .map((id) => `"${id}"`)
          .join(' OR ');

      platformLogs =
        await this.searchLogs({
          index: 'filebeat-slots-*',
          query: slotQuery,
          from: params.from,
          to: params.to,
          size: 10000,
        });
    }

    /**
     * ERROR FLOW
     *
     * IF ANY LOG FAILS INSIDE SAME
     * playSessionID
     *
     * RETURN COMPLETE FLOW
     */

    if (
      params.logType === 'error'
    ) {
      /**
       * FIND FAILED LOGS
       */

      const failedLogs = [
        ...betLogs.filter((x) =>
          this.isFailedLog(x),
        ),

        ...winLogs.filter((x) =>
          this.isFailedLog(x),
        ),

        ...adjustmentLogs.filter(
          (x) =>
            this.isFailedLog(x),
        ),

        ...platformLogs.filter((x) =>
          this.isFailedLog(x),
        ),
      ];

      /**
       * FAILED playSessionIDs
       */

      const failedPlaySessionIDs =
        this.extractPlaySessionIDs(
          failedLogs,
        );

      /**
       * KEEP COMPLETE ROUND FLOW
       */

      betLogs = betLogs.filter(
        (log: any) => {
          const data =
            JSON.stringify(log);

          return failedPlaySessionIDs.some(
            (id) =>
              data.includes(
                `"playSessionID":${id}`,
              ),
          );
        },
      );

      winLogs = winLogs.filter(
        (log: any) => {
          const data =
            JSON.stringify(log);

          return failedPlaySessionIDs.some(
            (id) =>
              data.includes(
                `"playSessionID":${id}`,
              ),
          );
        },
      );

      adjustmentLogs =
        adjustmentLogs.filter(
          (log: any) => {
            const data =
              JSON.stringify(log);

            return failedPlaySessionIDs.some(
              (id) =>
                data.includes(
                  `"playSessionID":${id}`,
                ),
            );
          },
        );

      platformLogs =
        platformLogs.filter(
          (log: any) => {
            const data =
              JSON.stringify(log);

            return failedPlaySessionIDs.some(
              (id) =>
                data.includes(
                  `"playSessionID":${id}`,
                ),
            );
          },
        );
    }

    /**
     * FINAL SW RESPONSE
     */

    return {
      flowType: 'SW',

      searchedIP: params.ip,

      authenticateLogs,

      betLogs,

      winLogs,

      adjustmentLogs,

      platformLogs,
    };
  }
}