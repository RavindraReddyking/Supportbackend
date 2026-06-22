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

  
private isLobbyGame(gameName?: string): boolean {
  return (
    gameName?.toLowerCase().includes('lobby') ||
    false
  );
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
      /&amp;amp;amp;amp;/g,
      '&amp;amp;amp;',
    );

  const parsed = this.parseUrl(cleanedUrl);

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
    tableConfigResponse?.recordset?.[0] || null;

  const styleName =
    parsed.stylename ||
    parsed.secureLogin;

  const casinoResponse: any =
    await this.repository.findCasinoUsers(
      styleName || '',
    );

  let casinos = casinoResponse?.recordset || [];
  console.log("STYLE NAME:", styleName);
console.log("CASINO RESPONSE:", JSON.stringify(casinoResponse, null, 2));
console.log("CASINOS LENGTH:", casinos.length);

  const token =
    parsed.token ||
    parsed.tc ||
    parsed.ppToken;

  // =====================================================
  // ✅ STEP 1: ENTRY LOG SEARCH
  // =====================================================

  const rawLogs =
    await this.repository.searchGameLaunchLogs({
      token: token || '',
      gameId: parsed.symbol,
      from,
      to,
    });

  console.log(
    'RAW LOGS FULL:',
    JSON.stringify(rawLogs, null, 2),
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
  // ✅ STEP 2: UUID EXTRACTION (FIXED ✅)
  // =====================================================

  const getUUID = (log: any) => {
    return (
      log?.contextMap?.uuid ||
      log?.contextMap?.['uuid:'] ||
      null
    );
  };

  const entryLog = rawLogs.find((x: any) =>
    getUUID(x),
  );

  const uuid = getUUID(entryLog);

  console.log('UUID FOUND:', uuid);

  // =====================================================
  // ✅ STEP 3: UUID SEARCH
  // =====================================================

  let uuidLogs: any[] = [];

  if (uuid) {
    uuidLogs =
      await this.repository.searchLogsByUUID({
        uuid,
        from,
        to,
      });
  }

  console.log(
    'UUID LOG COUNT:',
    uuidLogs.length,
  );

  // =====================================================
  // ✅ STEP 4: CONFIG DETECTION (IMPROVED ✅)
  // =====================================================

  const logsToCheck =
    uuidLogs.length > 0
      ? uuidLogs
      : rawLogs;

  const configErrorLog =
    logsToCheck.find((log: any) => {
      const msg =
        log?.message ||
        log?.error ||
        JSON.stringify(log);

      return (
        msg.includes('Impl not found') ||
        msg.includes(
          'Missing Impl for casino',
        )
      );
    });

  const isConfigIssue =
    Boolean(configErrorLog);

    
// ✅ STEP: IF CONFIG ISSUE → RETURN EARLY ✅
if (isConfigIssue) {
  return {
    success: true,
    issueType: 'CONFIG',
    configError: configErrorLog?.message || null,
    duration: { from, to },
    parsed,
    logs: this.mapLogs(logsToCheck), // ✅ show relevant logs
  };
}



  console.log(
    'CONFIG ISSUE DETECTED:',
    isConfigIssue,
  );


  
// STEP: NO CONFIG → FETCH FULL LOGS ✅
const fullLogs =
  await this.repository.searchAllLogsByToken({
    token: token || '',
    from,
    to,
  });

console.log('FULL TOKEN LOGS:', fullLogs.length);

  // =====================================================
  // ✅ CASINO MATCHING (UNCHANGED)
  // =====================================================
// =====================================================
// ✅ FINAL DECISION FLOW (FIXED ✅)
// =====================================================

const hasLogs =
  (uuidLogs && uuidLogs.length > 0) ||
  (rawLogs && rawLogs.length > 0);

const singleCasino = casinos.length === 1;

// ✅ MULTIPLE CASINOS + LOGS → FILTER
if (!singleCasino && hasLogs) {
 
let matchedCasinoId =
  uuidLogs.find((x: any) =>
    x?.contextMap?.casinoId,
  )?.contextMap?.casinoId ||
  rawLogs.find((x: any) =>
    x?.contextMap?.casinoId,
  )?.contextMap?.casinoId;

  if (matchedCasinoId) {
    casinos = casinos.filter(
      (x: any) =>
        `${x.casino_id}` ===
        `${matchedCasinoId}`,
    );
  }
}

// ✅ MULTIPLE + NO LOGS → DO NOTHING ✅
// ✅ SINGLE CASINO → DO NOTHING ✅
 
  const casinoData: any[] = [];

  for (const casino of casinos) {
    const result =
      await this.buildCasinoResult(
        casino,
        parsed.symbol,
        tableConfig,
        params.cookies || '',
      );

    casinoData.push(result);
  }

  // =====================================================
  // ✅ FINAL RESPONSE
  // =====================================================

  return {
    success: true,

    issueType: isConfigIssue
      ? 'CONFIG'
      : 'NORMAL',

    configError: isConfigIssue
      ? configErrorLog?.message
      : null,

    duration: { from, to },

    parsed,

    
gameDetails: {
  gameId:
    tableConfig?.operator_game_id ||
    parsed.symbol,

  tableName:
    tableConfig?.table_name ||
    casinoData?.[0]
      ?.platformGameName ||
    '',

  tableId:
    casinoData?.[0]?.lcEnabled ===
    'NA'
      ? 'NA'
      : tableConfig?.table_id ||
        'NA',
},

    baseTableData:
      casinoData?.[0]?.baseTableData ||
      null,

    chromaTables:
      casinoData?.[0]?.chromaTables ||
      [],

   casinos: casinoData,

logs: this.mapLogs(fullLogs),
  };
}
  // =====================================================
  // BUILD CASINO RESULT
// =====================================================
// ✅ FINAL BUILD CASINO RESULT
// =====================================================
private async buildCasinoResult(
  casino: any,
  symbol: string,
  tableConfig: any,
  cookies: string,
) {
  const casinoId = casino.casino_id;

  const [lcTables, platformGames] =
    await Promise.all([
      this.getLcEnabledTables(casinoId, cookies),
      this.getCasinoGames(casinoId),
    ]);

  const games =
    platformGames?.data?.games || [];

  const baseFamily =
    symbol.match(/^\d+/)?.[0] || symbol;

  // ✅ LC TABLE IDS
  const lcGameIds = lcTables.map(
    (x: any) => `${x.operator_game_id}`,
  );

  // ✅ BASE TABLE STATUS
  const baseTableLcEnabled =
    lcGameIds.includes(baseFamily);

  const baseTablePlatformEnabled =
    games.some(
      (x: any) =>
        `${x.gameID}` === baseFamily,
    );

  const lcActiveTable =
    lcGameIds.find((x: string) =>
      x.startsWith(baseFamily),
    ) || null;

  // ✅ FIND CHROMA TABLES
  const chromaPlatformGames =
    games.filter((x: any) => {
      const id = `${x.gameID}`;
      return (
        id.startsWith(baseFamily) &&
        id !== baseFamily
      );
    });

  return {
    casinoId,

    casinoName:
      casino.casino_desc ||
      casino.email_address,

    envName:
      platformGames?.env || '',

    casinoactiveFlag:
      casino.active_flag,

    // ✅ ✅ BASE TABLE (ALWAYS)
    baseTableData: {
      baseTable: baseFamily,
      lcEnabled: baseTableLcEnabled,
      platformEnabled:
        baseTablePlatformEnabled,
      lcActiveTable,
    },

    // ✅ ✅ CHROMA TABLES
    chromaTables:
      chromaPlatformGames.length === 0
        ? []
        : chromaPlatformGames.map(
            (game: any) => ({
              gameId: `${game.gameID}`,

              gameName:
                game.gameName ||
                game.name ||
                game.game_name ||
                '',

              // ✅ platform status (dynamic)
              platformEnabled:
                games.some(
                  (x: any) =>
                    `${x.gameID}` ===
                    `${game.gameID}`,
                ),

              // ✅ LC status per chroma
              lcEnabled:
                lcGameIds.includes(
                  `${game.gameID}`,
                ),
            }),
          ),
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