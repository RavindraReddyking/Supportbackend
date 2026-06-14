import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import axios from 'axios';
import * as crypto from 'crypto';
import dayjs from 'dayjs';
import * as https from 'https';

import { GameLaunchRepository } from './gamelaunch.repository';

type ParsedGameLaunchUrl = {
  type: string;

  stylename?: string;

  secureLogin?: string;

  userId?: string;

  ppkv?: string;

  country?: string;

  token?: string;

  tc?: string;

  ppToken?: string;

  ppCasinoId?: string;

  gameid?: string;

  environmentID?: string;

  symbol: string;
};

@Injectable()
export class GameLaunchService {
  constructor(
    private readonly repository: GameLaunchRepository,
  ) {}

  private readonly rgsSecret =
    process.env.RGS_SECRET || '';

  private readonly internalApiUrl =
    process.env.INTERNAL_API_URL ||
    'http://localhost:3000';

  // =====================================================
  // HELPERS
  // =====================================================

  private extractCasinoId(
    casinoId: string,
  ): string {
    const numericPart =
      casinoId.replace(/\D/g, '');

    let startIndex =
      numericPart.length - 4;

    while (
      startIndex > 0 &&
      numericPart[startIndex] === '0'
    ) {
      startIndex--;
    }

    return numericPart.substring(startIndex);
  }

  private extractBaseTable(
    symbol: string,
  ): string | null {
    const match =
      symbol.match(/^\d+/);

    if (!match) {
      return null;
    }

    const baseTable =
      match[0];

    if (baseTable !== symbol) {
      return baseTable;
    }

    return null;
  }

  // =====================================================
  // PLATFORM ENABLED GAMES
  // =====================================================

  async getCasinoGames(
    casinoId: string,
  ) {
    const casinoData: any =
      await this.repository.getCasinoDetails(
        casinoId,
      );

    const data =
      casinoData?.recordset?.[0];

    if (!data) {
      throw new NotFoundException(
        'Casino not found',
      );
    }

    const login = String(
      data.login,
    ).trim();

    const env = String(
      data.env,
    ).trim();

    const UCID = data.UCID;

    const finalCasinoId =
      this.extractCasinoId(casinoId);

    const path =
      `/RGSGateway/GameAPI/getCasinoGames/${finalCasinoId}/`;

    let url =
      `https://api-${env}.ppgames.net${path}`;

    const timestamp = Math.round(
      new Date().getTime() / 1000,
    ).toString();

    const pathForHmac =
      path.toUpperCase();

    const strForHmac =
      `GET-${timestamp}-${pathForHmac}`;

    const hmacMd5 = crypto
      .createHmac(
        'md5',
        this.rgsSecret,
      )
      .update(strForHmac)
      .digest('hex');

    const rgsHash = Buffer.from(
      hmacMd5,
      'utf8',
    ).toString('base64');

    const headers = {
      'Content-Type':
        'application/x-www-form-urlencoded',

      authentication:
        `hmac ${login}:${rgsHash}`,

      timestamp,
    };

    try {
      let response: any;

      try {
        response =
          await axios.get(
            url,
            {
              headers,
            },
          );
      } catch {
        url =
          `https://api-${env}.pragmaticplay.net${path}`;

        response =
          await axios.get(
            url,
            {
              headers,
            },
          );
      }

      return {
        success: true,
        requestedUrl: url,
        casinoId: finalCasinoId,
        env,
        UCID,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        response:
          error.response?.data ||
          null,
      };
    }
  }

  // =====================================================
  // LC ENABLED TABLES
  // =====================================================

  async getLcEnabledTables(
    casinoId: string,
    cookies: string,
  ) {
    try {
      const response =
        await axios.get(
          `${this.internalApiUrl}/api/lc-enabled-tables`,
          {
            params: {
              casinoid:
                casinoId,
            },

            headers: cookies
              ? {
                  cookie:
                    cookies,
                }
              : {},

            httpsAgent:
              new https.Agent({
                rejectUnauthorized:
                  false,
              }),

            timeout: 30000,
          },
        );

      return (
        response?.data?.data ||
        []
      );
    } catch {
      return [];
    }
  }

  // =====================================================
  // INVESTIGATION
  // =====================================================

  async investigate(params: {
    url: string;
    startDate?: string;
    endDate?: string;
    cookies?: string;
  }) {
    const cleanedUrl =
      params.url.replace(
        /&amp;amp;amp;/g,
        '&amp;amp;',
      );

    const parsed =
      this.parseUrl(cleanedUrl);

    const from =
      params.startDate ||
      dayjs()
        .subtract(24, 'hour')
        .toISOString();

    const to =
      params.endDate ||
      dayjs().toISOString();

    const tableConfigResponse: any =
      await this.repository.getTableConfig(
        parsed.symbol,
      );

    const tableConfig =
      tableConfigResponse
        ?.recordset?.[0] || null;

    const styleName =
      parsed.stylename ||
      parsed.secureLogin;

    const casinoResponse: any =
      await this.repository.findCasinoUsers(
        styleName || '',
      );

    let casinos =
      casinoResponse
        ?.recordset || [];

    const token =
      parsed.token ||
      parsed.tc ||
      parsed.ppToken;

    const rawLogs =
      await this.repository.searchGameLaunchLogs(
        {
          token:
            token || '',
          gameId:
            parsed.symbol,
          from,
          to,
        },
      );

    const logs =
      this.filterGameLaunchLogs(
        rawLogs,
        token || '',
      );

console.log(
  'TOTAL MATCHED LOGS:',
  logs.length,
);

    // =====================================================
    // CASINO MATCHING
    // =====================================================

    if (casinos.length > 1) {
      
console.log(
  'MULTIPLE CASINOS FOUND',
);

console.log(
  'TRYING CONTEXTMAP CASINO MATCH',
);

      let matchedCasinoId =
        logs.find(
          (x: any) =>
            x?.contextMap
              ?.casinoId,
        )?.contextMap
          ?.casinoId;

console.log(
  'CONTEXTMAP MATCHED CASINO:',
  matchedCasinoId,
);

      // FALLBACK USING app.casinoID + stage
      if (!matchedCasinoId) {
        
console.log(
  'CONTEXTMAP FAILED -> USING FALLBACK FLOW',
);

        const fallbackLog =
        
          logs.find(
            (x: any) =>
              x?.app?.casinoID &&
              x?.stage,
          );

console.log(
  'FALLBACK LOG FOUND:',
  Boolean(fallbackLog),
);

        if (fallbackLog) {
          const shortCasinoId =
            `${fallbackLog.app.casinoID}`;

          const envFromStage =
            fallbackLog.stage
              ?.replace(
                /^prod[-_]?/i,
                '',
              )
              ?.toLowerCase();

console.log({
  shortCasinoId,
  envFromStage,
});

          matchedCasinoId =
            casinos.find(
              (casino: any) => {
                const casinoId =
                  `${casino.casino_id}`;

                const numericCasinoId =
                  casinoId.replace(
                    /\D/g,
                    '',
                  );

                const casinoEnv =
                  casinoId
                    .replace(
                      /^ppc/i,
                      '',
                    )
                    .replace(
                      /\d+$/,
                      '',
                    )
                    .toLowerCase();

                let envMatched =
                  false;

                if (
                  /^[a-z]+0$/i.test(
                    envFromStage,
                  )
                ) {
                  const baseEnv =
                    envFromStage.slice(
                      0,
                      -1,
                    );

                  envMatched =
                    casinoEnv ===
                      baseEnv ||
                    casinoEnv ===
                      envFromStage;
                } else {
                  envMatched =
                    casinoEnv ===
                    envFromStage;
                }

                const casinoMatched =
                  Number(
                    numericCasinoId,
                  ) ===
                    Number(
                      shortCasinoId,
                    ) &&
                  envMatched;

                return casinoMatched;
              },
            )?.casino_id;
        }
      }


      if (matchedCasinoId) {
        console.log(
  'FINAL MATCHED CASINO:',
  matchedCasinoId,
);
        casinos =
          casinos.filter(
            (x: any) =>
              `${x.casino_id}` ===
              `${matchedCasinoId}`,
          );
      }
    }

    const casinoData: any[] = [];

    for (const casino of casinos) {
      const result =
        await this.buildCasinoResult(
          casino,
          parsed.symbol,
          tableConfig,
          params.cookies ||
            '',
        );

      casinoData.push(result);
    }

    return {
      success: true,

      duration: {
        from,
        to,
      },

      parsed,

      gameDetails: {
        gameId:
          tableConfig
            ?.operator_game_id ||
          parsed.symbol,

        tableName:
          tableConfig
            ?.table_name ||
          '',

        tableId:
          tableConfig
            ?.table_id ||
          '',

        lcEnabled:
          Boolean(
            casinoData?.[0]
              ?.lcEnabled,
          ),

        platformEnabled:
          Boolean(
            casinoData?.[0]
              ?.platformEnabled,
          ),

        tableOpen:
          casinoData?.[0]
            ?.tableOpen ??
          null,
      },

      baseTableData:
        casinoData?.[0]
          ?.baseTableData ||
        null,

      chromaTables:
        casinoData?.[0]
          ?.chromaTables ||
        [],

      casinos:
        casinoData.map(
          ({
            lcEnabled,
            platformEnabled,
            tableOpen,
            baseTableData,
            chromaTables,
            ...casino
          }: any) => casino,
        ),

      logs:
        this.mapLogs(logs),
    };
  }

  // =====================================================
  // BUILD CASINO RESULT
  // =====================================================

  private async buildCasinoResult(
    casino: any,
    symbol: string,
    tableConfig: any,
    cookies: string,
  ) {
    const casinoId =
      casino.casino_id;

    const [
      lcTables,
      platformGames,
    ] = await Promise.all([
      this.getLcEnabledTables(
        casinoId,
        cookies,
      ),

      this.getCasinoGames(
        casinoId,
      ),
    ]);

    const lcMatch =
      lcTables?.find(
        (x: any) =>
          `${x.operator_game_id}` ===
            `${symbol}` ||
          `${x.gameID}` ===
            `${symbol}` ||
          `${x.gameid}` ===
            `${symbol}` ||
          `${x.symbol}` ===
            `${symbol}` ||
          `${x.operatorGameId}` ===
            `${symbol}`,
      );

    const games =
      platformGames?.data
        ?.games || [];

    const platformMatch =
      games.find(
        (x: any) =>
          `${x.gameID}` ===
          `${symbol}`,
      );

    const baseFamily =
      symbol.match(/^\d+/)?.[0] ||
      symbol;

    const lcGameIds =
      lcTables.map(
        (x: any) =>
          `${x.operator_game_id}`,
      );

    const baseTableLcEnabled =
      lcGameIds.includes(
        baseFamily,
      );

    const baseTablePlatformEnabled =
      games.some(
        (x: any) =>
          `${x.gameID}` ===
          baseFamily,
      );

    const chromaPlatformGames =
      games.filter(
        (x: any) => {
          const gameId =
            `${x.gameID}`;

          return (
            gameId.startsWith(
              baseFamily,
            ) &&
            gameId !==
              baseFamily
          );
        },
      );

    const uniqueChromaTables =
      [
        ...new Set(
          chromaPlatformGames.map(
            (x: any) =>
              `${x.gameID}`,
          ),
        ),
      ];

    const lcActiveTable =
      lcGameIds.find(
        (x: string) =>
          x.startsWith(
            baseFamily,
          ),
      ) || null;

    return {
      casinoId,

      casinoName:
        lcMatch?.casino_desc ||
        casino.email_address,

      envName:
        platformGames?.env ||
        lcMatch?.env_name ||
        '',

      casinoactiveFlag:
        casino.active_flag,

      baseTableData: {
        baseTable:
          baseFamily,

        lcEnabled:
          baseTableLcEnabled,

        platformEnabled:
          baseTablePlatformEnabled,

        lcActiveTable,
      },

      chromaTables:
        uniqueChromaTables
          .map((tableId) => ({
            symbol: tableId,

            platformEnabled:
              chromaPlatformGames.some(
                (x: any) =>
                  `${x.gameID}` ===
                  tableId,
              ),

            lcEnabled:
              lcGameIds.includes(
                tableId,
              ),
          }))
          .filter(
            (x) =>
              x.platformEnabled ||
              x.lcEnabled,
          ),

      lcEnabled:
        Boolean(
          lcMatch,
        ),

      platformEnabled:
        Boolean(
          platformMatch,
        ),

      tableOpen:
        lcMatch?.table_open ??
        null,
    };
  }

  // =====================================================
  // FILTER GAME LAUNCH LOGS
  // =====================================================

  private filterGameLaunchLogs(
    logs: any[],
    token: string,
  ) {
    return this.dedupeByTimestampAndMessage(
      logs.filter((log: any) => {
        const combined =
          JSON.stringify(log);

        return combined.includes(
          token,
        );
      }),
    );
  }

  // =====================================================
  // URL PARSER
  // =====================================================

  private parseUrl(
    url: string,
  ): ParsedGameLaunchUrl {
    if (
      url.includes(
        'playGame.do',
      )
    ) {
      return this.parsePlayGameUrl(
        url,
      );
    }

    if (
      url.includes(
        'openGame.do',
      )
    ) {
      return this.parseOpenGameUrl(
        url,
      );
    }

    return this.parseGameLaunch(
      url,
    );
  }

  private parsePlayGameUrl(
    url: string,
  ): ParsedGameLaunchUrl {
    const parsed =
      new URL(url);

    const key =
      decodeURIComponent(
        parsed.searchParams.get(
          'key',
        ) || '',
      );

    const keyMap: any = {};

    key
      .split('`|`')
      .forEach((x) => {
        const [
          k,
          v,
        ] = x.split('=');

        keyMap[k] = v;
      });

    return {
      type: 'PLAY_GAME',

      stylename:
        parsed.searchParams.get(
          'stylename',
        ) || '',

      userId:
        parsed.searchParams.get(
          'userId',
        ) || '',

      ppkv:
        parsed.searchParams.get(
          'ppkv',
        ) || '',

      country:
        parsed.searchParams.get(
          'country',
        ) || '',

      token:
        keyMap.token || '',

      symbol:
        keyMap.symbol || '',
    };
  }

  private parseOpenGameUrl(
    url: string,
  ): ParsedGameLaunchUrl {
    const parsed =
      new URL(url);

    return {
      type: 'OPEN_GAME',

      stylename:
        parsed.searchParams.get(
          'stylename',
        ) || '',

      symbol:
        parsed.searchParams.get(
          'symbol',
        ) || '',

      tc:
        parsed.searchParams.get(
          'tc',
        ) || '',
    };
  }

  private parseGameLaunch(
    url: string,
  ): ParsedGameLaunchUrl {
    const parsed =
      new URL(url);

    return {
      type:
        'GAME_LAUNCH',

      secureLogin:
        parsed.searchParams.get(
          'secureLogin',
        ) || '',

      stylename:
        parsed.searchParams.get(
          'stylename',
        ) || '',

      gameid:
        parsed.searchParams.get(
          'gameid',
        ) || '',

      environmentID:
        parsed.searchParams.get(
          'environmentID',
        ) || '',

      ppToken:
        parsed.searchParams.get(
          'ppToken',
        ) || '',

      ppCasinoId:
        parsed.searchParams.get(
          'ppCasinoId',
        ) || '',

      symbol:
        parsed.searchParams.get(
          'gameid',
        ) || '',
    };
  }

  // =====================================================
  // DEDUPE
  // =====================================================

  private dedupeByTimestampAndMessage<
    T extends {
      timestamp?: string;
      message?: string;
    },
  >(items: T[]): T[] {
    const seen =
      new Set<string>();

    const result: T[] = [];

    for (const item of items) {
      const key =
        `${item?.timestamp || ''}__${
          item?.message || ''
        }`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      result.push(item);
    }

    return result;
  }

  // =====================================================
  // LOG MAPPER
  // =====================================================

  private mapLogs(logs: any[]) {
    return logs.map(
      (log: any) => ({
        _id:
          log?._id || '',

        _index:
          log?._index || '',

        timestamp:
          log?.[
            '@timestamp'
          ] || '',

        app:
          log?.app || '',

        service:
          log?.service ||
          '',

        serviceName:
          log?.serviceName ||
          '',

        serviceMethod:
          log?.serviceMethod ||
          '',

        stage:
          log?.stage || '',

        error:
          log?.error || '',

        responseLog:
          log?.responseLog ||
          '',

        requestLog:
          log?.requestLog ||
          '',

        host:
          log?.host || '',

        message:
          log?.message ||
          '',

        contextMap:
          log?.contextMap ||
          {},
      }),
    );
  }
}