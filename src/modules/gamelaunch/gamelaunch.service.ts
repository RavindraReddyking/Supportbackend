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

  user_id?: string;

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
    'http://localhost:4001';

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

private extractErrorCodeFromText(
  text: string,
): number | null {
  const match =
    text.match(/"error"\s*:\s*(\d+)/) ||
    text.match(/\berror\s*[:=]\s*(\d+)/i);

  return match
    ? Number(match[1])
    : null;
}


private has521Error(
  logs: any[],
): boolean {
  return logs.some(
    (log: any) => {
      const text = [
        log?.message,
        log?.responseLog,
        log?.error,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        text.includes('"error":521') ||
        text.includes(
          'Unsupported jurisdiction',
        )
      );
    },
  );
}

private analyze521(
  playerCountry: string,
  playerRegion: string,
  jurisdictionSettings: any,
  countrySettings: any,
  regionSettings: any,
) {
  const blockedCountries =
    String(
      countrySettings?.casinoBlockedCountries ||
      '',
    )
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

      const unblockedCountries =
  String(
    countrySettings?.unblockedCountries ||
    '',
  )
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
    const regulatedMarkets = [
  'AB', // Alberta
  'AQ', // Alberta
  'GG', // Alderney
  'X3', // Argentina Other
  'AT', // Austria
  'BS', // Bahamas
  'BY', // Belarus
  'BE', // Belgium
  'BR', // Brazil
  'X1', // Buenos Aires City
  'X2', // Buenos Aires Province
  'BG', // Bulgaria
  'CO', // Colombia
  'CZ', // Czech Republic
  'DK', // Denmark
  'EE', // Estonia
  'GE', // Georgia
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IM', // Isle of Man
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'MT', // Malta
  'MX', // Mexico
  'NO', // Norway
  'ON', // Ontario
  'PR', // Parana (Brazil)
  'PE', // Peru
  'PH', // Philippines
  'PT', // Portugal
  'RO', // Romania
  'RS', // Serbia
  'SK', // Slovakia
  'SI', // Slovenia
  'ZA', // South Africa
  'ES', // Spain
  'SE', // Sweden
  'CH', // Switzerland
  'NL', // Netherlands
  'UA', // Ukraine
  'UK', // United Kingdom
  'GB'
];

const geoBlockedCountries = [
  'US',
  'FR',
  'IL',
  'TW',
  'AU',
  'KP',
  'IN',
  'SG',
  'IR',
  'AE',
];

  const blockedRegions =
    String(
      regionSettings?.casinoBlockedRegions ||
      '',
    )
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

      const unblockedRegions =
  String(
    regionSettings?.unblockedRegions ||
    '',
  )
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const accessibleJurisdictions =
  String(
    jurisdictionSettings?.accessibleJurisdictions ||
    '',
  )
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const casinoJurisdiction =
  String(
    jurisdictionSettings?.casinoJurisdiction ||
    '',
  ).trim();
const jurisdictionMatched =
  casinoJurisdiction &&
  casinoJurisdiction !== '99' &&
  casinoJurisdiction.toUpperCase() !== 'ALL' &&
  (
    playerCountry === casinoJurisdiction ||
    playerRegion === casinoJurisdiction
  );

  if (
    blockedCountries.includes(
      playerCountry,
    )
  ) {
    return {
      category:
        'CASINO_COUNTRY_BLOCK',

      recommendation:
        'Player country exists in casino blocked countries.',
    };
  }

  if (
    blockedRegions.includes(
      playerRegion,
    )
  ) {
    return {
      category:
        'CASINO_REGION_BLOCK',

      recommendation:
        'Player region exists in casino blocked regions.',
    };
  }
 

// =====================================================
// CANADA REGION RESTRICTIONS
// ON and AB must be explicitly present in unblockedRegions
// =====================================================

if (
  playerCountry === 'CA' &&
  ['ON', 'AB'].includes(playerRegion) &&
  !unblockedRegions.includes(playerRegion)
) {
  return {
    category:
      'RESTRICTED_REGION_BLOCK',

    recommendation:
      `${playerCountry}/${playerRegion} must be explicitly present in unblockedRegions.`,
  };
}

const isRegulatedMarket =
  regulatedMarkets.includes(
    playerCountry,
  ) ||
  regulatedMarkets.includes(
    playerRegion,
  );

const explicitlyAllowed =
  accessibleJurisdictions.includes(
    playerCountry,
  ) ||
  accessibleJurisdictions.includes(
    playerRegion,
  ) ||
  unblockedCountries.includes(
    playerCountry,
  ) ||
  unblockedRegions.includes(
    playerRegion,
  );
  if (
  !jurisdictionMatched &&
  isRegulatedMarket &&
  !explicitlyAllowed
)
{
  return {
    category:
      'REGULATED_MARKET_BLOCK',

    recommendation:
      `${playerCountry}/${playerRegion} is a regulated market and is not allowed in accessible/unblocked settings.`,
  };
}

console.log(
  'PLAYER COUNTRY:',
  JSON.stringify(playerCountry),
);

console.log(
  'UNBLOCKED COUNTRIES:',
  JSON.stringify(unblockedCountries),
);

console.log(
  'GEO BLOCKED:',
  geoBlockedCountries.includes(
    playerCountry,
  ),
);
if (
  geoBlockedCountries.includes(
    playerCountry,
  ) &&
  !unblockedCountries.includes(
    playerCountry,
  ) &&
  !unblockedRegions.includes(
    playerRegion,
  )
) {
  return {
    category:
      'PLATFORM_GEOIP_BLOCK',

    recommendation:
      `${playerCountry}/${playerRegion} is blocked by default platform GeoIP restrictions.`,
  };
}
if (
  accessibleJurisdictions.length > 0 &&
  !explicitlyAllowed
) {
  return {
    category:
      'ACCESSIBLE_JURISDICTION_BLOCK',

    recommendation:
      'Player jurisdiction is not present in accessible/unblocked settings.',
  };
}

  return {
    category:
      'UNKNOWN_521',

    recommendation:
      'No blocking condition was identified in platform configuration. Please contact the Platform team for further RCA',
  };
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

  // Fallback if ppgames returns empty response
  if (
    !response.data ||
    `${response.data}`.trim() === ''
  ) {
    console.log(
      'PPGAMES returned empty response, falling back to pragmaticplay.net',
    );

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
} catch (error: any) {
  console.log(
    'PPGAMES failed:',
    error.message,
  );

  url =
    `https://api-${env}.pragmaticplay.net${path}`;

  console.log(
    'Trying fallback URL:',
    url,
  );

  response =
    await axios.get(
      url,
      {
        headers,
      },
    );
}
console.log('REQUESTED URL:', url);

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

  //Platfrom Config Fetch//

  async getCasinoPlatformConfig(
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

  const path =
    '/RGSGateway/CommonAPI/casino/configurations';

  let url =
    `https://api-${env}.ppgames.net${path}`;

  const timestamp = Math.round(
    new Date().getTime() / 1000,
  ).toString();

  const pathForHmac =
    path.toUpperCase();

  const strForHmac =
    `POST-${timestamp}-${pathForHmac}`;

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
        await axios.post(
          url,
          {},
          {
            headers,
          },
        );

      if (
        !response.data ||
        `${response.data}`.trim() === ''
      ) {
        console.log(
          'PPGAMES returned empty response, falling back to pragmaticplay.net',
        );

        url =
          `https://api-${env}.pragmaticplay.net${path}`;

        response =
          await axios.post(
            url,
            {},
            {
              headers,
            },
          );
      }
    } catch (error: any) {
      console.log(
        'PPGAMES failed:',
        error.message,
      );

      url =
        `https://api-${env}.pragmaticplay.net${path}`;

      console.log(
        'Trying fallback URL:',
        url,
      );

      response =
        await axios.post(
          url,
          {},
          {
            headers,
          },
        );
    }

    console.log(
      'PLATFORM CONFIG URL:',
      url,
    );

    return {
      success: true,
      requestedUrl: url,
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

          timeout: 45000,
        },
      );

    return (
      response?.data?.data ||
      []
    );
  } catch (error: any) {
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
 
const cleanedUrl = params.url
  .replace(/&amp;/g, '&')
  .replace(/&amp;amp;/g, '&');


console.log('CLEANED URL:', cleanedUrl);

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

const tableFamilyResponse: any =
  await this.repository.getTableFamily(
    parsed.symbol,
  );

const tableFamily =
  tableFamilyResponse?.recordset || [];

  const styleName =
    parsed.stylename ||
    parsed.secureLogin;

  const casinoResponse: any =
    await this.repository.findCasinoUsers(
      styleName || '',
    );

  let casinos = casinoResponse?.recordset || [];
  console.log("STYLE NAME:", styleName);
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
const matchedCasinoId =
  logsToCheck.find(
    (x: any) =>
      x?.contextMap?.casinoId,
  )?.contextMap?.casinoId || null;

const matchedCasinoName =
  logsToCheck.find(
    (x: any) =>
      x?.contextMap?.casinoName,
  )?.contextMap?.casinoName || null;

if (
  casinos.length === 0 &&
  matchedCasinoId
) {
  casinos = [
    {
      casino_id:
        matchedCasinoId,

      casino_desc:
        matchedCasinoName,

      active_flag: null,
    },
  ];
}

const configErrorLogs =
  logsToCheck.filter((log: any) => {
    const msg =
      log?.message ||
      log?.error ||
      JSON.stringify(log);

    return (
      msg.includes('Impl not found') ||
      msg.includes('Missing Impl for casino') ||
      msg.includes('Operator OWC is not correct')
    );
  });

const isConfigIssue =
  configErrorLogs.length > 0;


  const configErrors =
  configErrorLogs.map((log: any) => ({
    timestamp:
      log?.['@timestamp'] || '',

    message:
      log?.message ||
      log?.error ||
      '',
  }));

  let fullLogs: any[] = [];

fullLogs =
  await this.repository.searchAllLogsByToken({
    token: token || '',
    from,
    to,
  });

console.log(
  'FULL TOKEN LOGS:',
  fullLogs.length,
);

console.log(
  'FIRST LOG CASINO ID:',
  fullLogs[0]?.contextMap?.casinoId,
);

const matchedCasinoIdFromFullLogs =
  fullLogs.find(
    (x: any) =>
      x?.contextMap?.casinoId,
  )?.contextMap?.casinoId || null;

console.log(
  'MATCHED CASINO ID FROM FULL LOGS:',
  matchedCasinoIdFromFullLogs,
);

let prohibitedJurisdictionLogs: any[] = [];
prohibitedJurisdictionLogs =
  logsToCheck.filter((log: any) => {
    const msg = [
      log?.message,
      log?.requestLog,
      log?.responseLog,
      log?.error,
    ]
      .filter(Boolean)
      .join(' ');

    const errorCode =
      this.extractErrorCodeFromText(
        msg,
      );

    const uuid =
      log?.contextMap?.uuid ||
      log?.contextMap?.['uuid:'] ||
      '';

    const hasError0InSameSession =
      errorCode === 0 ||
      logsToCheck.some((x: any) => {
        const otherUuid =
          x?.contextMap?.uuid ||
          x?.contextMap?.['uuid:'] ||
          '';

        if (
          uuid &&
          otherUuid &&
          uuid !== otherUuid
        ) {
          return false;
        }

        const otherText = [
          x?.message,
          x?.requestLog,
          x?.responseLog,
          x?.error,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          this.extractErrorCodeFromText(
            otherText,
          ) === 0
        );
      });

    const hasLcBlockMessage =
      msg.includes(
        'Prohibited Jurisdictions',
      ) ||
      msg.includes(
        'You are not allowed to play Live Dealer',
      ) ||
      msg.includes(
        'Auth error jurisdiction',
      ) ||
      msg.includes(
        'IP is not allowed for blocked country',
      );

    return (
      hasError0InSameSession &&
      hasLcBlockMessage
    );
  });
console.log(
  'CONFIG ISSUE DETECTED:',
  isConfigIssue,
);

  // =====================================================
  // ✅ CASINO MATCHING (UNCHANGED)
  // =====================================================
// =====================================================
// ✅ FINAL DECISION FLOW (FIXED ✅)
// =====================================================
const hasLogs =
  (uuidLogs && uuidLogs.length > 0) ||
  (rawLogs && rawLogs.length > 0) ||
  (fullLogs && fullLogs.length > 0);

const singleCasino = casinos.length === 1;

const effectiveMatchedCasinoId =
  matchedCasinoIdFromFullLogs ||
  matchedCasinoId;

// ✅ MULTIPLE CASINOS + LOGS → FILTER
if (
  !singleCasino &&
  hasLogs &&
  effectiveMatchedCasinoId
) {
  casinos = casinos.filter(
    (x: any) =>
      `${x.casino_id}` ===
      `${effectiveMatchedCasinoId}`,
  );
}

// ✅ MULTIPLE + NO LOGS → DO NOTHING ✅
// ✅ SINGLE CASINO → DO NOTHING ✅
const responseLogs = Array.from(
  new Map(
    [
      ...logsToCheck,
      ...fullLogs,
    ].map((log: any) => [
      log?._id ||
        `${log?.['@timestamp']}_${log?.message}`,
      log,
    ]),
  ).values(),
);

const platformLogs =
  responseLogs.filter(
    (log: any) =>
      log?._index?.startsWith(
        'filebeat-slots',
      ),
  );

const lcLogs =
  responseLogs.filter(
    (log: any) =>
      !log?._index?.startsWith(
        'filebeat-slots',
      ),
  );

const has521 =
  this.has521Error(
    lcLogs,
  );
  console.log(
  'LC LOG COUNT:',
  lcLogs.length,
);


console.log(
  'HAS 521:',
  has521,
);

let platformConfig = null;

const platformConfigInfo = {
  casinoJurisdiction: '',
  jurisdictionPriority: '',
  accessibleJurisdictions: '',
  casinoBlockedCountries: '',
  unblockedCountries: '',
  casinoBlockedRegions: '',
  unblockedRegions: '',
};
const tableConfigEventMap =
new Map<string, any[]>();
for (const log of prohibitedJurisdictionLogs) {
  const text = [
    log?.message,
    log?.requestLog,
    log?.responseLog,
    log?.error,
  ]
    .filter(Boolean)
    .join(' ');

  const sessionId =
    log?.contextMap?.uuid ||
    log?.contextMap?.['uuid:'] ||
    '';

  const relatedLogs =
    logsToCheck.filter((x: any) => {
      const otherSessionId =
        x?.contextMap?.uuid ||
        x?.contextMap?.['uuid:'] ||
        '';

      return (
        sessionId &&
        otherSessionId === sessionId
      );
    });

  const relatedText =
    [
      text,
      ...relatedLogs.map((x: any) =>
        [
          x?.message,
          x?.requestLog,
          x?.responseLog,
          x?.error,
        ]
          .filter(Boolean)
          .join(' '),
      ),
    ].join(' ');

  const operatorGameId =
    relatedText.match(/gameid=(\d+)/i)?.[1] ||
    relatedText.match(/"gameID":"([^"]+)"/)?.[1] ||
    relatedText.match(/"operatorGameId":"([^"]+)"/)?.[1] ||
    parsed.symbol;

  const playerIp =
    relatedText.match(
      /"ipAddress":"([^"]+)"/,
    )?.[1] || '';

  const playerCountry =
    relatedText.match(
      /"ipCountry":"([^"]+)"/,
    )?.[1] || '';

  const playerRegion =
    relatedText.match(
      /"ipRegion":"([^"]+)"/,
    )?.[1] || '';

  const prohibitedMessage =
    relatedText.includes(
      'IP is not allowed for blocked country',
    )
      ? 'IP is not allowed for blocked country'
      : relatedText.includes(
          'Auth error jurisdiction',
        )
        ? 'Auth error jurisdiction'
        : log?.message ||
          'You are not allowed to play Live Dealer';

  this.pushTableConfigEvent(
    tableConfigEventMap,
    operatorGameId,
    {
      timestamp:
        log?.['@timestamp'] || '',

      player_ip:
        playerIp,

      player_country:
        playerCountry,

      player_region:
        playerRegion,

      session_id:
        sessionId,

      lc_level_block:
        true,

      block_level:
        'LC',

      recommendation:
        'Player is blocked at LC level due to prohibited jurisdiction.',

      prohibited_message:
        prohibitedMessage,
    },
  );
}

if (
  has521 &&
  casinos.length === 1
) {
  platformConfig =
    await this.getCasinoPlatformConfig(
      casinos[0].casino_id,
    );

  console.log(
    'PLATFORM CONFIG COUNT:',
    platformConfig?.data
      ?.casinoConfigurations
      ?.length,
  );

  const targetCasinoId =
    this.extractCasinoId(
      casinos[0].casino_id,
    );

  const matchedCasinoConfig =
    platformConfig?.data
      ?.casinoConfigurations
      ?.find(
        (x: any) =>
          `${x.casinoID}` ===
          `${targetCasinoId}`,
      );

  console.log(
    'TARGET CASINO ID:',
    targetCasinoId,
  );

  console.log(
    'MATCHED CASINO:',
    matchedCasinoConfig?.casinoName,
  );

console.log(
  'MATCHED CONFIG:',
  JSON.stringify(
    matchedCasinoConfig || {},
  ).substring(0, 2000),
);



const jurisdictionSettings =
  matchedCasinoConfig?.configuration
    ?.jurisdictionSettings;

const countrySettings =
  matchedCasinoConfig?.configuration
    ?.countrySettings;

const regionSettings =
  matchedCasinoConfig?.configuration
    ?.regionSettings;

platformConfigInfo.casinoJurisdiction =
  jurisdictionSettings?.casinoJurisdiction ||
  '';

platformConfigInfo.jurisdictionPriority =
  jurisdictionSettings?.jurisdictionPriority ||
  '';

platformConfigInfo.accessibleJurisdictions =
  jurisdictionSettings?.accessibleJurisdictions ||
  '';

platformConfigInfo.casinoBlockedCountries =
  countrySettings?.casinoBlockedCountries ||
  '';

platformConfigInfo.unblockedCountries =
  countrySettings?.unblockedCountries ||
  '';

platformConfigInfo.casinoBlockedRegions =
  regionSettings?.casinoBlockedRegions ||
  '';

platformConfigInfo.unblockedRegions =
  regionSettings?.unblockedRegions ||
  '';

const authLogs =
  lcLogs.filter((log: any) => {
    const text = [
      log?.message,
      log?.requestLog,
      log?.responseLog,
      log?.error,
    ]
      .filter(Boolean)
      .join(' ');

    const errorCode =
      this.extractErrorCodeFromText(
        text,
      );

    return (
      text.includes(
        '/RGSGateway/UserAPI/',
      ) &&
      errorCode === 521 &&
      text.includes(
        'Unsupported jurisdiction',
      )
    );
  });
const uniqueFailures = Array.from(
  new Map(
    authLogs.map((authLog: any) => {
      const authText = [
        authLog?.message,
        authLog?.requestLog,
        authLog?.responseLog,
        authLog?.error,
      ]
        .filter(Boolean)
        .join(' ');

      const gameId =
        authText.match(/"gameID":"([^"]+)"/)?.[1] ||
        authText.match(/"operatorGameId":"([^"]+)"/)?.[1] ||
        parsed.symbol ||
        '';

      const playerIp =
        authText.match(
          /"ipAddress":"([^"]+)"/,
        )?.[1] || '';

      const playerCountry =
        authText.match(
          /"ipCountry":"([^"]+)"/,
        )?.[1] || '';

      const playerRegion =
        authText.match(
          /"ipRegion":"([^"]+)"/,
        )?.[1] || '';

      const sessionId =
        authLog?.contextMap?.uuid ||
        authLog?.contextMap?.['uuid:'] ||
        '';

      const timestamp =
        authLog?.['@timestamp'] || '';

      const prohibitedMessage =
        authText.includes(
          'Unsupported jurisdiction',
        )
          ? '521 : Unsupported jurisdiction'
          : '521 : Unsupported jurisdiction';

      return [
        `${gameId}_${playerIp}_${playerCountry}_${playerRegion}_${sessionId}_PLATFORM`,
        {
          gameId,
          playerIp,
          playerCountry,
          playerRegion,
          sessionId,
          timestamp,
          prohibitedMessage,
        },
      ];
    }),
  ).values(),
);

for (const failure of uniqueFailures as any[]) {
  const analysis =
    this.analyze521(
      failure.playerCountry,
      failure.playerRegion,
      jurisdictionSettings,
      countrySettings,
      regionSettings,
    );

    this.pushTableConfigEvent(
    tableConfigEventMap,
    failure.gameId,
    {
      timestamp:
        failure.timestamp,

      player_ip:
        failure.playerIp,

      player_country:
        failure.playerCountry,

      player_region:
        failure.playerRegion,

      session_id:
        failure.sessionId,

      lc_level_block:
        false,

      block_level:
        'PLATFORM',

      recommendation:
        analysis.recommendation,

      prohibited_message:
        failure.prohibitedMessage ||
        '521 : Unsupported jurisdiction',
    },
  );
}

console.log(
  'JURISDICTION SETTINGS:',
  JSON.stringify(
    jurisdictionSettings,
  ),
);

console.log(
  'COUNTRY SETTINGS:',
  JSON.stringify(
    countrySettings,
  ),
);

console.log(
  'REGION SETTINGS:',
  JSON.stringify(
    regionSettings,
  ),
);

}




const casinoData: any[] = [];

for (const casino of casinos) {

const [lcTables, platformGames] =
  await Promise.all([
    this.getLcEnabledTables(
      casino.casino_id,
      params.cookies || '',
    ),
    this.getCasinoGames(
      casino.casino_id,
    ),
  ]);

const result =
  this.buildCasinoResult(
    casino,
    parsed.symbol,
    tableConfig,
    tableFamily,
    lcTables,
    platformGames,
  );

const casinoPlatformLogs =
  platformLogs.filter(
    (log: any) =>
      this.casinoMatches(
        casino.casino_id,
        log?.app?.casinoID,
      ),
  );

 const casinoLcLogs =
  lcLogs.filter(
    (log: any) =>
      log?.contextMap?.casinoId ===
      casino.casino_id,
  );

  const tableInfoWithConfig =
  this.attachTableConfigEvents(
    result.table_info,
    tableConfigEventMap,
  );

casinoData.push({
  casino_id:
    result.casino_id,

  casino_desc:
    result.casino_desc,

  env_name:
    result.env_name,

  casino_active_flag:
    result.casino_active_flag,

  config_error:
    configErrors,

  platform_config:
    platformConfigInfo,

  table_info:
    tableInfoWithConfig,

    log_info: [
      {
        log_type:
          'PLATFORM',

        logs:
  this.mapLogs(
    casinoPlatformLogs,
  ),
      },

      {
        log_type:
          'LC',

        logs:
  this.mapLogs(
    casinoLcLogs,
  ),
      },
    ],
  });
}

  // =====================================================
  // ✅ FINAL RESPONSE
  // =====================================================
// ===============================
// STEP 3: GAME DETAILS ARRAY   PUT IT HERE
// ===============================
const launchTable = [
  {
    operator_game_id:
      tableConfig?.operator_game_id ||
      parsed.symbol,

    table_name:
      tableConfig?.table_name ||
      null,

    table_id:
      tableConfig?.table_id ||
      null,
  },
];

// THEN return
return {
  success: true,

  duration: {
    from,
    to,
  },

  parsed,

  casinos:
    casinoData,
};
}

// Session or Token Based Investigation
async investigateSession(params: {
  token: string;
  startDate?: string;
  endDate?: string;
  cookies?: string;
}) {
  const from =
    params.startDate ||
    dayjs()
      .subtract(24, 'hour')
      .toISOString();

  const to =
    params.endDate ||
    dayjs().toISOString();

const rawToken =
  params.token;

const encodedToken =
  encodeURIComponent(
    rawToken,
  );

  console.log(
  'TOKEN:',
  params.token,
);

console.log(
  'ENCODED TOKEN:',
  encodedToken,
);

const [
  encodedLogs,
  rawLogs,
] = await Promise.all([
  this.repository.searchAllLogsByToken({
    token: encodedToken,
    from,
    to,
  }),

  this.repository.searchAllLogsByToken({
    token: rawToken,
    from,
    to,
  }),
]);

const fullLogs = Array.from(
  new Map(
    [...encodedLogs, ...rawLogs].map(
      (log: any) => [
        log._id,
        log,
      ],
    ),
  ).values(),
);

console.log(
  'ENCODED LOGS:',
  encodedLogs.length,
);

console.log(
  'RAW LOGS:',
  rawLogs.length,
);

console.log(
  'FULL LOGS AFTER DEDUPE:',
  fullLogs.length,
);

  console.log(
    'FULL TOKEN LOGS:',
    fullLogs.length,
  );

  const getUUID = (log: any) => {
    return (
      log?.contextMap?.uuid ||
      log?.contextMap?.['uuid:'] ||
      null
    );
  };
const uuids = [
  ...new Set(
    fullLogs
      .map((x: any) =>
        getUUID(x),
      )
      .filter(Boolean),
  ),
];

console.log(
  'ALL UUIDS:',
  uuids,
);

const uuidResults =
  await Promise.all(
    uuids.map((uuid) =>
      this.repository.searchLogsByUUID({
        uuid,
        from,
        to,
      }),
    ),
  );

const uuidLogs = Array.from(
  new Map(
    uuidResults
      .flat()
      .map((log: any) => [
        log._id,
        log,
      ]),
  ).values(),
);

console.log(
  'UUID LOG COUNT:',
  uuidLogs.length,
);
  const logsToCheck =
    uuidLogs.length > 0
      ? uuidLogs
      : fullLogs;

const uuidGameMap = new Map<
  string,
  string
>();

for (const log of logsToCheck) {
  const text = [
    log?.message,
    log?.requestLog,
    log?.responseLog,
  ]
    .filter(Boolean)
    .join(' ');

const gameId =
  text.match(/gameid=(\d+)/i)?.[1] ||
  text.match(/"gameID":"([^"]+)"/)?.[1] ||
  text.match(/"operatorGameId":"([^"]+)"/)?.[1];

  const uuid =
    log?.contextMap?.uuid ||
    log?.contextMap?.['uuid:'];

  if (uuid && gameId) {
    uuidGameMap.set(
      uuid,
      gameId,
    );
  }
}
const configErrorLogs =
  logsToCheck.filter((log: any) => {
    const msg =
      log?.message ||
      log?.error ||
      JSON.stringify(log);

    return (
      msg.includes(
        'Impl not found',
      ) ||
      msg.includes(
        'Missing Impl for casino',
      ) ||
      msg.includes(
        'Operator OWC is not correct',
      )
    );
  });

const isConfigIssue =
  configErrorLogs.length > 0;

  console.log(
    'CONFIG ISSUE:',
    isConfigIssue,
  );

const configErrors =
  configErrorLogs.map((log: any) => ({
    timestamp:
      log?.['@timestamp'] || '',

    message:
      log?.message ||
      log?.error ||
      '',
  }));
let prohibitedJurisdictionLogs: any[] = [];
prohibitedJurisdictionLogs =
  logsToCheck.filter((log: any) => {
    const msg = [
      log?.message,
      log?.requestLog,
      log?.responseLog,
      log?.error,
    ]
      .filter(Boolean)
      .join(' ');

    const errorCode =
      this.extractErrorCodeFromText(
        msg,
      );

    const uuid =
      log?.contextMap?.uuid ||
      log?.contextMap?.['uuid:'] ||
      '';

    const hasError0InSameSession =
      errorCode === 0 ||
      logsToCheck.some((x: any) => {
        const otherUuid =
          x?.contextMap?.uuid ||
          x?.contextMap?.['uuid:'] ||
          '';

        if (
          uuid &&
          otherUuid &&
          uuid !== otherUuid
        ) {
          return false;
        }

        const otherText = [
          x?.message,
          x?.requestLog,
          x?.responseLog,
          x?.error,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          this.extractErrorCodeFromText(
            otherText,
          ) === 0
        );
      });

    const hasLcBlockMessage =
      msg.includes(
        'Prohibited Jurisdictions',
      ) ||
      msg.includes(
        'You are not allowed to play Live Dealer',
      ) ||
      msg.includes(
        'Auth error jurisdiction',
      ) ||
      msg.includes(
        'IP is not allowed for blocked country',
      );

    return (
      hasError0InSameSession &&
      hasLcBlockMessage
    );
  });

const uniqueGameIds = [
  ...new Set(
    fullLogs
      .map((log: any) => {
        const text = [
          log?.message,
          log?.requestLog,
          log?.responseLog,
        ]
          .filter(Boolean)
          .join(' ');

return (
  text.match(/"gameID":"([^"]+)"/)?.[1] ||
  text.match(/"operatorGameId":"([^"]+)"/)?.[1]
);

      })
      .filter(Boolean),
  ),
];
  console.log(
    'UNIQUE GAME IDS:',
    uniqueGameIds,
  );

  const matchedCasinoId =
    fullLogs.find(
      (x: any) =>
        x?.contextMap?.casinoId,
    )?.contextMap?.casinoId || null;

   

  const matchedCasinoName =
    fullLogs.find(
      (x: any) =>
        x?.contextMap?.casinoName,
    )?.contextMap?.casinoName || null;

  const casinos =
    matchedCasinoId
      ? [
          {
            casino_id:
              matchedCasinoId,

            casino_desc:
              matchedCasinoName,

            active_flag:
              null,
          },
        ]
      : [];


 let tableConfigs: any[] = [];
let tableFamilies: any[] = [];

if (
  matchedCasinoId &&
  uniqueGameIds.length > 0
) {
  const [
    tableConfigsResponse,
    tableFamiliesResponse,
  ] = await Promise.all([
    this.repository.getTableConfigs(
      matchedCasinoId,
      uniqueGameIds as string[],
    ),
    this.repository.getTableFamilies(
      uniqueGameIds as string[],
    ),
  ]);

  tableConfigs =
    tableConfigsResponse?.recordset ||
    [];

  tableFamilies =
    tableFamiliesResponse?.recordset ||
    [];
}
console.log(
  'TABLE FAMILIES COUNT =>',
  tableFamilies.length,
);

console.log(
  'TABLE FAMILIES =>',
  JSON.stringify(tableFamilies, null, 2),
);

const missingGameIds = (
  uniqueGameIds as string[]
).filter((gameId) => {
  const existsInConfig =
    tableConfigs.some(
      (x: any) =>
        `${x.operator_game_id}` ===
        `${gameId}`,
    );

  return !existsInConfig;
});

console.log(
  'MISSING GAME IDS:',
  missingGameIds,
);
if (missingGameIds.length > 0) {
  const fallbackResponse =
    await this.repository.getDistinctTableConfig(
      missingGameIds,
    );

 const fallbackConfigs: any[] =
  fallbackResponse?.recordset ||
  [];

  for (const row of fallbackConfigs) {
    if (
      !tableConfigs.some(
        (x: any) =>
          `${x.operator_game_id}` ===
          `${row.operator_game_id}`,
      )
    ) {
      tableConfigs.push(row);
    }
  }
}


const configMap = new Map(
  tableConfigs.map(
    (x: any) => [
      x.operator_game_id,
      x,
    ],
  ),
);
const familyMap = new Map<string, any[]>();

for (const row of tableFamilies) {
  const familyKey =
    String(row.operator_game_id)
      .match(/^\d+/)?.[0];

  if (!familyKey) {
    continue;
  }

  if (!familyMap.has(familyKey)) {
    familyMap.set(
      familyKey,
      [],
    );
  }

  (
    familyMap.get(familyKey) as any[]
  ).push(row);
}
console.log(
  'TABLE FAMILIES COUNT =>',
  tableFamilies.length,
);

console.log(
  'FAMILY MAP KEYS =>',
  [...familyMap.keys()],
);

console.log(
  'TABLE FAMILIES =>',
  JSON.stringify(
    tableFamilies,
    null,
    2,
  ),
);

const launchTable: any[] = [];

for (const gameId of uniqueGameIds as string[]) {
  const tableConfig: any =
  configMap.get(gameId);

  launchTable.push({
    operator_game_id:
      tableConfig?.operator_game_id ||
      gameId,

    table_name:
      tableConfig?.table_name ||
      null,

    table_id:
      tableConfig?.table_id ||
      null,
  });
}

const responseLogs = Array.from(
  new Map(
    [
      ...logsToCheck,
      ...fullLogs,
    ].map((log: any) => [
      log?._id ||
        `${log?.['@timestamp']}_${log?.message}`,
      log,
    ]),
  ).values(),
);


  const platformLogs =
    responseLogs.filter(
      (log: any) =>
        log?._index?.startsWith(
          'filebeat-slots',
        ),
    );

  const lcLogs =
    responseLogs.filter(
      (log: any) =>
        !log?._index?.startsWith(
          'filebeat-slots',
        ),
    );

const has521 =
  this.has521Error(
    lcLogs,
  );

  console.log(
  'LC LOG COUNT:',
  lcLogs.length,
);


console.log(
  'HAS 521:',
  has521,
);

let platformConfig = null;

const platformConfigInfo = {
  casinoJurisdiction: '',
  jurisdictionPriority: '',
  accessibleJurisdictions: '',
  casinoBlockedCountries: '',
  unblockedCountries: '',
  casinoBlockedRegions: '',
  unblockedRegions: '',
};

const tableConfigEventMap =
  new Map<string, any[]>();
 for (const log of prohibitedJurisdictionLogs) {
  const text = [
    log?.message,
    log?.requestLog,
    log?.responseLog,
    log?.error,
  ]
    .filter(Boolean)
    .join(' ');

  const sessionId =
    log?.contextMap?.uuid ||
    log?.contextMap?.['uuid:'] ||
    '';

  const relatedLogs =
    logsToCheck.filter((x: any) => {
      const otherSessionId =
        x?.contextMap?.uuid ||
        x?.contextMap?.['uuid:'] ||
        '';

      return (
        sessionId &&
        otherSessionId === sessionId
      );
    });

  const relatedText =
    [
      text,
      ...relatedLogs.map((x: any) =>
        [
          x?.message,
          x?.requestLog,
          x?.responseLog,
          x?.error,
        ]
          .filter(Boolean)
          .join(' '),
      ),
    ].join(' ');

  const operatorGameId =
    relatedText.match(/gameid=(\d+)/i)?.[1] ||
    relatedText.match(/"gameID":"([^"]+)"/)?.[1] ||
    relatedText.match(/"operatorGameId":"([^"]+)"/)?.[1] ||
    uuidGameMap.get(sessionId) ||
    '';

  const playerIp =
    relatedText.match(
      /"ipAddress":"([^"]+)"/,
    )?.[1] || '';

  const playerCountry =
    relatedText.match(
      /"ipCountry":"([^"]+)"/,
    )?.[1] || '';

  const playerRegion =
    relatedText.match(
      /"ipRegion":"([^"]+)"/,
    )?.[1] || '';

  const prohibitedMessage =
    relatedText.includes(
      'IP is not allowed for blocked country',
    )
      ? 'IP is not allowed for blocked country'
      : relatedText.includes(
          'Auth error jurisdiction',
        )
        ? 'Auth error jurisdiction'
        : log?.message ||
          'You are not allowed to play Live Dealer';

  this.pushTableConfigEvent(
    tableConfigEventMap,
    operatorGameId,
    {
      timestamp:
        log?.['@timestamp'] || '',

      player_ip:
        playerIp,

      player_country:
        playerCountry,

      player_region:
        playerRegion,

      session_id:
        sessionId,

      lc_level_block:
        true,

      block_level:
        'LC',

      recommendation:
        'Player is blocked at LC level due to prohibited jurisdiction.',

      prohibited_message:
        prohibitedMessage,
    },
  );
}

if (
  has521 &&
  casinos.length === 1
) {
  platformConfig =
    await this.getCasinoPlatformConfig(
      casinos[0].casino_id,
    );

  console.log(
    'PLATFORM CONFIG COUNT:',
    platformConfig?.data
      ?.casinoConfigurations
      ?.length,
  );

  const targetCasinoId =
    this.extractCasinoId(
      casinos[0].casino_id,
    );

  const matchedCasinoConfig =
    platformConfig?.data
      ?.casinoConfigurations
      ?.find(
        (x: any) =>
          `${x.casinoID}` ===
          `${targetCasinoId}`,
      );

  console.log(
    'TARGET CASINO ID:',
    targetCasinoId,
  );

  console.log(
    'MATCHED CASINO:',
    matchedCasinoConfig?.casinoName,
  );

console.log(
  'MATCHED CONFIG:',
  JSON.stringify(
    matchedCasinoConfig || {},
  ).substring(0, 2000),
);


  const jurisdictionSettings =
  matchedCasinoConfig?.configuration
    ?.jurisdictionSettings;

const countrySettings =
  matchedCasinoConfig?.configuration
    ?.countrySettings;

const regionSettings =
  matchedCasinoConfig?.configuration
    ?.regionSettings;

    
platformConfigInfo.casinoJurisdiction =
  jurisdictionSettings?.casinoJurisdiction ||
  '';

platformConfigInfo.jurisdictionPriority =
  jurisdictionSettings?.jurisdictionPriority ||
  '';

platformConfigInfo.accessibleJurisdictions =
  jurisdictionSettings?.accessibleJurisdictions ||
  '';

platformConfigInfo.casinoBlockedCountries =
  countrySettings?.casinoBlockedCountries ||
  '';

platformConfigInfo.unblockedCountries =
  countrySettings?.unblockedCountries ||
  '';

platformConfigInfo.casinoBlockedRegions =
  regionSettings?.casinoBlockedRegions ||
  '';

platformConfigInfo.unblockedRegions =
  regionSettings?.unblockedRegions ||
  '';

const authLogs =
  lcLogs.filter((log: any) => {
    const text = [
      log?.message,
      log?.requestLog,
      log?.responseLog,
      log?.error,
    ]
      .filter(Boolean)
      .join(' ');

    const errorCode =
      this.extractErrorCodeFromText(
        text,
      );

    return (
      text.includes(
        '/RGSGateway/UserAPI/',
      ) &&
      errorCode === 521 &&
      text.includes(
        'Unsupported jurisdiction',
      )
    );
  });
const uniqueFailures = Array.from(
  new Map(
    authLogs.map((authLog: any) => {
      const authText = [
        authLog?.message,
        authLog?.requestLog,
        authLog?.responseLog,
        authLog?.error,
      ]
        .filter(Boolean)
        .join(' ');

      const sessionId =
        authLog?.contextMap?.uuid ||
        authLog?.contextMap?.['uuid:'] ||
        '';

      const gameId =
        authText.match(/"gameID":"([^"]+)"/)?.[1] ||
        authText.match(/"operatorGameId":"([^"]+)"/)?.[1] ||
        uuidGameMap.get(sessionId) ||
        '';

      const playerIp =
        authText.match(
          /"ipAddress":"([^"]+)"/,
        )?.[1] || '';

      const playerCountry =
        authText.match(
          /"ipCountry":"([^"]+)"/,
        )?.[1] || '';

      const playerRegion =
        authText.match(
          /"ipRegion":"([^"]+)"/,
        )?.[1] || '';

      const timestamp =
        authLog?.['@timestamp'] || '';

      const prohibitedMessage =
        authText.includes(
          'Unsupported jurisdiction',
        )
          ? '521 : Unsupported jurisdiction'
          : '521 : Unsupported jurisdiction';

      return [
        `${gameId}_${playerIp}_${playerCountry}_${playerRegion}_${sessionId}_PLATFORM`,
        {
          gameId,
          playerIp,
          playerCountry,
          playerRegion,
          sessionId,
          timestamp,
          prohibitedMessage,
        },
      ];
    }),
  ).values(),
);

console.log(
  'AUTH LOGS COUNT:',
  authLogs.length,
);

console.log(
  'UNIQUE 521 FAILURES:',
  uniqueFailures.length,
);

for (const failure of uniqueFailures as any[]) {
  const analysis =
    this.analyze521(
      failure.playerCountry,
      failure.playerRegion,
      jurisdictionSettings,
      countrySettings,
      regionSettings,
    );
  
    this.pushTableConfigEvent(
    tableConfigEventMap,
    failure.gameId,
    {
      timestamp:
        failure.timestamp,

      player_ip:
        failure.playerIp,

      player_country:
        failure.playerCountry,

      player_region:
        failure.playerRegion,

      session_id:
        failure.sessionId,

      lc_level_block:
        false,

      block_level:
        'PLATFORM',

      recommendation:
        analysis.recommendation,

      prohibited_message:
        failure.prohibitedMessage ||
        '521 : Unsupported jurisdiction',
    },
  );
}

console.log(
  'JURISDICTION SETTINGS:',
  JSON.stringify(
    jurisdictionSettings,
  ),
);

console.log(
  'COUNTRY SETTINGS:',
  JSON.stringify(
    countrySettings,
  ),
);

console.log(
  'REGION SETTINGS:',
  JSON.stringify(
    regionSettings,
  ),
);
}

  const casinoData: any[] = [];

  for (const casino of casinos) {
    const tableInfo: any[] = [];

    let firstResult: any =
      null;

      const [lcTables, platformGames] =
  await Promise.all([
    this.getLcEnabledTables(
      casino.casino_id,
      params.cookies || '',
    ),
    this.getCasinoGames(
      casino.casino_id,
    ),
  ]);

for (const gameId of uniqueGameIds as string[]) {

  const tableConfig =
  configMap.get(
    String(gameId),
  ) || null;

const baseFamily =
  String(gameId)
    .match(/^\d+/)?.[0] ||
  String(gameId);

const tableFamily =
  familyMap.get(
    baseFamily,
  ) || [];

    const result =
  this.buildCasinoResult(
    casino,
    String(gameId),
    tableConfig,
    tableFamily,
    lcTables,
    platformGames,
  );

      if (!firstResult) {
        firstResult =
          result;
      }

      tableInfo.push(
        ...result.table_info,
      );
    }

    const uniqueTableInfo =
      tableInfo.filter(
        (
          table,
          index,
          self,
        ) =>
          index ===
          self.findIndex(
            (x) =>
              x.operator_game_id ===
              table.operator_game_id,
          ),
      );

      const uniqueTableInfoWithConfig =
  this.attachTableConfigEvents(
    uniqueTableInfo,
    tableConfigEventMap,
  );

    const casinoPlatformLogs =
      platformLogs.filter(
        (log: any) =>
          this.casinoMatches(
            casino.casino_id,
            log?.app?.casinoID,
          ),
      );

    const casinoLcLogs =
      lcLogs.filter(
        (log: any) =>
          log?.contextMap
            ?.casinoId ===
          casino.casino_id,
      );

    casinoData.push({
      casino_id:
        casino.casino_id,

      casino_desc:
        casino.casino_desc,

      env_name:
        firstResult?.env_name ||
        '',

      casino_active_flag:
        casino.active_flag,
   config_error:
  configErrors,

platform_config:
  platformConfigInfo,

table_info:
  uniqueTableInfoWithConfig,

      log_info: [
        {
          log_type:
            'PLATFORM',

          logs:
            this.mapLogs(
              casinoPlatformLogs,
            ),
        },

        {
          log_type:
            'LC',

          logs:
            this.mapLogs(
              casinoLcLogs,
            ),
        },
      ],
    });
  }
return {
  success: true,

  duration: {
    from,
    to,
  },

  parsed: {
    type:
      'SESSION_ANALYSIS',

    token:
      params.token,
  },

  casinos:
    casinoData,
};
}
  // =====================================================
  // BUILD CASINO RESULT
// =====================================================
// ✅ FINAL BUILD CASINO RESULT
// =====================================================
private buildCasinoResult(
  casino: any,
  symbol: string,
  tableConfig: any,
  tableFamily: any[],
  lcTables: any[],
  platformGames: any,
) {
  const casinoId =
    casino.casino_id;

  const games =
    platformGames?.data?.games || [];

  const baseFamily =
    symbol.match(/^\d+/)?.[0] ||
    symbol;
    
const lcGameIds =
  lcTables.map(
    (x: any) =>
      `${x.operator_game_id}`,
  );

console.log(
  'CASINO ID =>',
  casinoId,
);

console.log(
  'BASE FAMILY =>',
  baseFamily,
);

console.log(
  'PLATFORM GAMES COUNT =>',
  games.length,
);

console.log(
  'PLATFORM GAME IDS =>',
  games.map(
    (x: any) => x.gameID,
  ),
);

console.log(
  'MATCHING GAME =>',
  games.find(
    (x: any) =>
      `${x.gameID}` ===
      `${baseFamily}`,
  ),
);
  return {
    casino_id:
      casinoId,

    casino_desc:
      casino.casino_desc ||
      casino.email_address,

    env_name:
      platformGames?.env || '',

    casino_active_flag:
      casino.active_flag,
 table_info: [
  {
    is_base_table: true,

    base_table_id: baseFamily,

    operator_game_id: baseFamily,

    table_name:
      tableConfig?.table_name ||
      tableFamily?.[0]?.table_name ||
      null,

    platform_enabled:
      games.some(
        (x: any) =>
          `${x.gameID}` ===
          `${baseFamily}`,
      ),

    lc_enabled:
      lcGameIds.includes(
        `${baseFamily}`,
      ),

    table_config:
      [],
  },

  ...tableFamily
    .filter(
      (table: any) =>
        table.operator_game_id !==
        baseFamily,
    )
    .map(
      (table: any) => ({
        is_base_table: false,

        base_table_id: baseFamily,

        operator_game_id:
          table.operator_game_id,

        table_name:
          table.table_name,

        platform_enabled:
          games.some(
            (x: any) =>
              `${x.gameID}` ===
              `${table.operator_game_id}`,
          ),

        lc_enabled:
          lcGameIds.includes(
            `${table.operator_game_id}`,
          ),

        table_config:
          [],
      }),
    ),
],
  };
}

//Push table config evnet//
private pushTableConfigEvent(
  tableConfigEventMap: Map<string, any[]>,
  operatorGameId: string,
  event: any,
) {
  if (!operatorGameId) {
    return;
  }

  const key = `${operatorGameId}`;

  if (!tableConfigEventMap.has(key)) {
    tableConfigEventMap.set(key, []);
  }

  const existingEvents =
    tableConfigEventMap.get(key) || [];

  const uniqueKey =
    `${operatorGameId}_${event.player_ip || ''}_${event.player_country || ''}_${event.player_region || ''}_${event.session_id || ''}_${event.block_level || ''}`;

  const alreadyExists =
    existingEvents.some(
      (x: any) =>
        `${operatorGameId}_${x.player_ip || ''}_${x.player_country || ''}_${x.player_region || ''}_${x.session_id || ''}_${x.block_level || ''}` ===
        uniqueKey,
    );

  if (!alreadyExists) {
    existingEvents.push(event);
  }

  tableConfigEventMap.set(
    key,
    existingEvents,
  );
}

private attachTableConfigEvents(
  tableInfo: any[],
  tableConfigEventMap: Map<string, any[]>,
) {
  return tableInfo.map((table: any) => {
    const operatorGameId =
      `${table.operator_game_id}`;

    const tableConfigEvents =
      tableConfigEventMap.get(operatorGameId) ||
      [];

    return {
      ...table,

      table_config:
        tableConfigEvents.sort(
          (a: any, b: any) =>
            new Date(a.timestamp || 0).getTime() -
            new Date(b.timestamp || 0).getTime(),
        ),
    };
  });
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
const rawKey = decodeURIComponent(
  parsed.searchParams.get('key') || '',
);

// ✅ EXTRA CLEAN (THIS FIXES YOUR CURRENT BUG)
const cleanedKey = rawKey.replace(/&amp;/g, '&');

const keyMap: any = {};

// ✅ FORMAT 1: `|`
if (cleanedKey.includes('`|`')) {
  cleanedKey.split('`|`').forEach((x) => {
    const [k, v] = x.split('=');
    keyMap[k] = v;
  });
}

// ✅ FORMAT 2: &
else if (cleanedKey.includes('&')) {
  const params = new URLSearchParams(cleanedKey);

  params.forEach((value, key) => {
    keyMap[key] = value;
  });
}

// ✅ ✅ CRITICAL: SAFE TOKEN EXTRACTION (no corruption possible)
// ✅ ✅ UNIVERSAL SAFE TOKEN EXTRACTION (handles all Pragmatic formats)
let safeToken = '';

// ✅ FORMAT 1: `|`
if (cleanedKey.includes('`|`')) {
  cleanedKey.split('`|`').forEach((x) => {
    const [k, v] = x.split('=');
    if (k === 'token') {
      safeToken = v;
    }
  });
}

// ✅ FORMAT 2: & (URL-style)
else if (cleanedKey.includes('&')) {
  const params = new URLSearchParams(cleanedKey);
  safeToken = params.get('token') || '';
}

// ✅ FALLBACK (extra safety)
if (!safeToken) {
  const match = cleanedKey.match(/token=([^`|&]+)/);
  safeToken = match ? match[1] : '';
}

// ✅ FINAL CLEAN
safeToken = safeToken.trim();

return {
  type: 'PLAY_GAME',

  stylename: parsed.searchParams.get('stylename') || '',

  user_id: (parsed.searchParams.get('userId') || '')
    .replace(/"/g, '')
    .trim(),

  ppkv: parsed.searchParams.get('ppkv') || '',
  country: parsed.searchParams.get('country') || '',

  token: safeToken, // ✅ CORRECTED TOKEN

  symbol:
    keyMap.symbol ||
    parsed.searchParams.get('symbol') ||
    '',
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
private casinoMatches(
  casinoId: string,
  platformCasinoId: any,
): boolean {
  if (!casinoId || !platformCasinoId) {
    return false;
  }

  const numericCasinoId =
    casinoId.replace(/\D/g, '');

  const platformId =
    String(platformCasinoId)
      .replace(/,/g, '');

  return numericCasinoId.endsWith(
    platformId,
  );
}

// =====================================================
// LC LOG LEVEL
// =====================================================
private getLcLogLevel(
  log: any,
): string {
  const text =
    log?.message || '';

  if (text.includes('"error":0')) {
    return 'SUCCESS';
  }

  if (
    text.match(
      /"error"\s*:\s*\d+/,
    )
  ) {
    return 'ERROR';
  }

  return 'INFO';
}


  private mapLogs(logs: any[]) {
    return logs.map(
      (log: any) => ({
        _id:
          log?._id || '',

        _index:
          log?._index || '',
          log_level:
  this.getLcLogLevel(log),

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