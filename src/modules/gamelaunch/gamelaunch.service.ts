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

    /*private readonly rgsSecret =
      process.env.RGS_SECRET || ''; */

      private getRgsSecret(): string {
  const nodeEnv =
    process.env.NODE_ENV?.toLowerCase();

  const secret =
    nodeEnv === 'prelive'
      ? 'testKey'
      : 'ESWLTOxIH8qAZt';

  console.log(
    'NODE_ENV:',
    nodeEnv,
  );

  console.log(
    'RGS SECRET USED:',
    secret,
  );

  return secret;
}

    private readonly internalApiUrl =
      process.env.INTERNAL_API_URL ||
      'http://localhost:4001';


    // For defining market type//
    private getMarketType(
  playerCountry: string,
  playerRegion: string,
): string {
  const regulatedMarkets = [
    'AB', 'AQ', 'GG', 'X3', 'AT', 'BS', 'BY', 'BE', 'BR', 'X1', 'X2',
    'BG', 'CO', 'CZ', 'DK', 'EE', 'GE', 'DE', 'GR', 'HU', 'IE', 'IM',
    'IT', 'LV', 'LT', 'MT', 'MX', 'NO', 'ON', 'PR', 'PE', 'PH', 'PT',
    'RO', 'RS', 'SK', 'SI', 'ZA', 'ES', 'SE', 'CH', 'NL', 'UA', 'UK',
    'GB',
  ];

  const geoBlockedCountries = [
    'US', 'FR', 'IL', 'TW', 'AU',
    'KP', 'IN', 'SG', 'IR', 'AE',
  ];

  if (
    regulatedMarkets.includes(playerCountry) ||
    regulatedMarkets.includes(playerRegion)
  ) {
    return 'Regulated Market';
  }

  if (geoBlockedCountries.includes(playerCountry)) {
    return 'Geo Block Country';
  }

  return 'Unregulated Market';
}

//adding gameid to logs//
private resolveOperatorGameIdForLog(
  log: any,
  uuidGameMap: Map<string, string>,
  uuidProcessRequestGameMap: Map<string, string>,
): string {
  const isPlatformLog =
    log?._index?.startsWith('filebeat-slots');

  const text = [
    log?.message,
    log?.requestLog,
    log?.responseLog,
    log?.error,
  ]
    .filter(Boolean)
    .join(' ');

  // Platform logs
  if (isPlatformLog) {
    return (
      String(
        log?.app?.game ||
        text.match(/"game":"([^"]+)"/)?.[1] ||
        '',
      )
    );
  }

  // LC logs
  return (
    this.resolveGameId(
      log,
      uuidGameMap,
      uuidProcessRequestGameMap,
    ) || ''
  );
}

//No Logs found case//

private buildHasLogsMap(
  logs: any[],
  uuidGameMap: Map<string, string>,
  uuidProcessRequestGameMap: Map<string, string>,
  uuidCasinoMap: Map<string, string>,
  ppenvCasinoMap: Map<string, string>,
  styleNameCasinoMap: Map<string, string>,
  dbCasinoMap: Map<string, string>,
) {
  const hasLogsMap =
    new Map<string, boolean>();

  for (const log of logs) {
    const gameId =
      this.resolveGameId(
        log,
        uuidGameMap,
        uuidProcessRequestGameMap,
      );

    const casinoId =
      this.resolveLcCasinoId(
        log,
        uuidCasinoMap,
        ppenvCasinoMap,
        styleNameCasinoMap,
        dbCasinoMap,
      );

    if (!gameId || !casinoId) {
      continue;
    }

    hasLogsMap.set(
      `${casinoId}_${gameId}`,
      true,
    );
  }

  return hasLogsMap;
}
    // =====================================================
    // HELPERS
    // =====================================================



private buildStyleNameCasinoMap(
  logs: any[],
) {
  const styleNameCasinoMap =
    new Map<string, string>();

  for (const log of logs) {
    const casinoId =
      log?.contextMap?.casinoId;

    if (!casinoId) {
      continue;
    }

    const text = [
      log?.message,
      log?.requestLog,
      log?.responseLog,
    ]
      .filter(Boolean)
      .join(' ');

   const styleName =
  text.match(
    /"stylename":"([^"]+)"/i,
  )?.[1] ||
  text.match(
    /stylename=([^&\s"]+)/i,
  )?.[1];


    if (
      styleName &&
      !styleNameCasinoMap.has(styleName)
    ) {
      styleNameCasinoMap.set(
        styleName,
        String(casinoId),
      );
    }
  }

  return styleNameCasinoMap;
}


//Stylanme ppenv mapper//
private async buildStyleNamePpenvCasinoMap(
  logs: any[],
) {
  const dbCasinoMap =
    new Map<string, string>();

  const uniquePairs =
    new Set<string>();

  for (const log of logs) {
    const text = [
      log?.message,
      log?.requestLog,
      log?.responseLog,
      log?.error,
    ]
      .filter(Boolean)
      .join(' ');

    const styleName =
      text.match(
        /"stylename":"([^"]+)"/i,
      )?.[1] ||
      text.match(
        /stylename=([^&\s"]+)/i,
      )?.[1];

    const ppenv =
      log?.contextMap?.ppenv;

    if (
      styleName &&
      ppenv
    ) {
     uniquePairs.add(
  `${styleName.toLowerCase()}|${String(ppenv).toLowerCase()}`,
);
    }
  }

  for (const pair of uniquePairs) {
    const [
      styleName,
      ppenv,
    ] = pair.split('|');

    const result: any =
      await this.repository.findCasinoByStyleNameAndEnv(
        styleName,
        ppenv,
      );

    const casinoId =
      result?.recordset?.[0]
        ?.casino_id;

    if (casinoId) {
      dbCasinoMap.set(
        pair,
        String(casinoId),
      );
    }
  }

  return dbCasinoMap;
}

// For mapping missing gameid's in authenticate//
private resolveGameId(
  log: any,
  uuidGameMap: Map<string, string>,
  uuidProcessRequestGameMap: Map<string, string>,
): string | undefined {
  const text = [
    log?.message,
    log?.requestLog,
    log?.responseLog,
    log?.error,
  ]
    .filter(Boolean)
    .join(' ');

  const uuid =
    log?.contextMap?.uuid ||
    log?.contextMap?.['uuid:'];
let gameId =
  text.match(/gameid=(\d+)/i)?.[1] ||
  text.match(/"gameID":"([^"]+)"/i)?.[1] ||
  text.match(/"operatorGameId":"([^"]+)"/i)?.[1] ||
  text.match(/"ppGame":"([^"]+)"/i)?.[1] ||
  (uuid ? uuidGameMap.get(uuid) : undefined);

// fallback only
if (!gameId && uuid) {
  gameId =
    uuidProcessRequestGameMap.get(uuid);
}

return gameId;

}
// From logs mapping for missing details//
private resolveLcCasinoId(
  log: any,
  uuidCasinoMap: Map<string, string>,
  ppenvCasinoMap: Map<string, string>,
  styleNameCasinoMap: Map<string, string>,
  dbCasinoMap: Map<string, string>,
): string | null {

  let casinoId =
    log?.contextMap?.casinoId;

  if (casinoId) {
    return String(casinoId);
  }

  const text = [
    log?.message,
    log?.requestLog,
    log?.responseLog,
    log?.error,
  ]
    .filter(Boolean)
    .join(' ');

  const uuid =
    log?.contextMap?.uuid ||
    log?.contextMap?.['uuid:'];

  if (uuid) {
    casinoId =
      uuidCasinoMap.get(uuid);

    if (casinoId) {
      console.log(
        'CASINO SOURCE = UUID MAP',
        uuid,
        casinoId,
      );

      return casinoId;
    }
  }

  const ppenv =
    log?.contextMap?.ppenv;

  if (ppenv) {
    casinoId =
      ppenvCasinoMap.get(
        String(ppenv),
      );

    if (casinoId) {
      console.log(
        'CASINO SOURCE = PPENV MAP',
        ppenv,
        casinoId,
      );

      return casinoId;
    }
  }

  const styleName =
    text.match(
      /"stylename":"([^"]+)"/i,
    )?.[1] ||
    text.match(
      /stylename=([^&\s"]+)/i,
    )?.[1];

  if (styleName) {
    casinoId =
      styleNameCasinoMap.get(
        styleName,
      );

    if (casinoId) {
      console.log(
        'CASINO SOURCE = STYLE MAP',
        styleName,
        casinoId,
      );

      return casinoId;
    }
  }

  // BODY LOOKUP
  // ACCEPT ONLY pp* CASINO IDS
  casinoId =
    text.match(
      /"casinoId":"?([^",}]+)"?/i,
    )?.[1] ||
    text.match(
      /"casinoID":"?([^",}]+)"?/i,
    )?.[1] ||
    text.match(
      /casinoid=([^&\s"]+)/i,
    )?.[1];

  if (casinoId) {
    const value =
      String(casinoId);

    if (
      value.startsWith('pp')
    ) {
      console.log(
        'CASINO SOURCE = BODY',
        value,
      );

      return value;
    }

    console.log(
      'BODY CASINO IGNORED',
      value,
    );
  }

  // DB LOOKUP LAST
  if (
    styleName &&
    ppenv
  ) {
    const dbCasinoId =
      dbCasinoMap.get(
        `${styleName.toLowerCase()}|${String(ppenv).toLowerCase()}`
      );

    if (dbCasinoId) {
      console.log(
        'CASINO SOURCE = DB MAP',
        styleName,
        ppenv,
        dbCasinoId,
      );

      return dbCasinoId;
    }
  }

  return null;
}
// For Loby games//
  private readonly GAME_NAME_OVERRIDE: Record<string, string> = {
    '007': 'MultiTable Play',
    '100001': 'CASIBOM Lobby',
    '100002': 'Gamdom Lobby',
    '100003': 'OZEL Lobby',
    '100004': '32ROSU Lobby',
    '100005': '32RED Lobby',
    '100006': '1WINLIVE Lobby',
    '100007': 'RAINBETCLUB Lobby',
    '100008': 'Sky Bet Lobby',
    '101': 'Live Casino Lobby',
    '102': 'Roulette Lobby',
    '103': 'Blackjack Lobby',
    '104': 'Baccarat Lobby',
    '105': 'Gameshows Lobby',
    '107': 'Sic Bo Lobby',
    '108': 'Dragon Tiger Lobby',
    '109': 'Sic Bo & Dragon Tiger',
    '110': 'D&W',
    '152': 'Sky Vegas Lobby',
    '153': 'Betfair Lobby',
    '154': 'Paddy Power Lobby',
    '163': 'Exclusives',
    '165': 'QQGroup Lobby',
    '166': 'Sky Casino Lobby',
    '167': 'Queen Casino Lobby',
    '168': 'Crash Games Lobby',
    '169': 'Poker Lobby',
    '170': 'MeritKing Lobby',
    '171': 'CrystalBet Lobby',
    '172': 'JetBahis Lobby',
    '173': 'Localised Lobby',
    '174': 'MPO Lounge',
    '175': 'ION Lobby',
    '176': 'Live Mania Lobby',
    '177': 'BCGame Lounge',
    '178': 'BayWin Lobby',
    '179': 'BetOrSpin Lobby',
    '180': 'Zlot Lobby',
    '181': 'Bahis Lobby',
    '182': 'TipoBet Lobby',
    '183': 'MarioBet Lobby',
    '184': 'MatadorBet Lobby',
    '185': 'Elite Lobby',
    '186': 'BetTurkey Lobby',
    '187': 'TarafBet Lobby',
    '188': 'Betist Lobby',
    '189': 'OnWin Lobby',
    '190': 'SahaBet Lobby',
    '191': 'Stake Lounge Lobby',
    '192': 'LuckyDreams Lobby',
    '193': 'LuckyOnes Lobby',
    '194': 'JustCasino Lobby',
    '195': 'MatBet Lobby',
    '196': 'JojoBet Ozel Lobby',
    '197': 'Mars Lobisi Lobby',
    '198': 'HoliganBet Lobby',
    '199': 'Shuffle Lobby',
  };

  private getGameDisplayName(
    gameId: string,
    gameName?: string,
  ): string {
    return (
      this.GAME_NAME_OVERRIDE[gameId] ||
      gameName ||
      gameId
    );
  }


  private getApiEnv(env: string): string {
    switch (env?.trim()?.toLowerCase()) {
      case 'dk':
        return 'dk0';

      case 'tw1':
        return 'sg19';

          case 'gi':
        return 'gi0';

      default:
        return env;
    }
  }


  //UUID missing logs mapping//
  private buildPpenvCasinoMap(
    logs: any[],
  ) {
    const ppenvCasinoMap =
      new Map<string, string>();

    for (const log of logs) {
      const ppenv =
        log?.contextMap?.ppenv;

      const casinoId =
        log?.contextMap?.casinoId;

      if (
        ppenv &&
        casinoId &&
        !ppenvCasinoMap.has(ppenv)
      ) {
        ppenvCasinoMap.set(
          String(ppenv),
          String(casinoId),
        );
      }
    }

    return ppenvCasinoMap;
  }

  //Platfrom config mapping helper//

  private getBaseApiUrl(apiEnv: string): string {

    if (
      process.env.NODE_ENV?.toLowerCase() === 'prelive'
    ) {
      return 'http://api.prerelease-env.biz';
    }

    const legacyEnvs = ['sga15', 'in4'];

    if (
      legacyEnvs.includes(
        apiEnv.toLowerCase(),
      )
    ) {
      return `https://api-${apiEnv}.ppgames.net`;
    }

    return `https://api-rgs-${apiEnv}.ppgames.net`;
  }

  private getFallbackApiUrl(apiEnv: string): string {

    if (
      process.env.NODE_ENV?.toLowerCase() === 'prelive'
    ) {
      return 'http://api.prerelease-env.biz';
    }

    const legacyEnvs = ['sga15', 'in4','tw'];

    if (
      legacyEnvs.includes(
        apiEnv.toLowerCase(),
      )
    ) {
      return `https://api-${apiEnv}.pragmaticplay.net`;
    }

    return `https://api-rgs-${apiEnv}.pragmaticplay.net`;
  }

  private extractCasinoId(
    casinoId: string,
  ): string {
    return String(
      Number(
        casinoId.replace(/\D/g, ''),
      ),
    );
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

  //Adding config helper//
  private populatePlatformConfigInfo(
    matchedCasinoConfig: any,
  ) {
    const jurisdictionSettings =
      matchedCasinoConfig?.configuration
        ?.jurisdictionSettings;

    const countrySettings =
      matchedCasinoConfig?.configuration
        ?.countrySettings;

    const regionSettings =
      matchedCasinoConfig?.configuration
        ?.regionSettings;
  return {
    casino_jurisdiction:
      jurisdictionSettings?.casinoJurisdiction?.trim()
        ? jurisdictionSettings.casinoJurisdiction
        : 'Allowed to all',

    jurisdiction_priority:
      jurisdictionSettings?.jurisdictionPriority?.trim()
        ? jurisdictionSettings.jurisdictionPriority
        : 'Allowed to all',

    accessible_jurisdictions:
      jurisdictionSettings?.accessibleJurisdictions?.trim()
        ? jurisdictionSettings.accessibleJurisdictions
        : 'Allowed to all',

    casino_blocked_countries:
      countrySettings?.casinoBlockedCountries?.trim()
        ? countrySettings.casinoBlockedCountries
        : 'N/A',

    unblocked_countries:
      countrySettings?.unblockedCountries?.trim()
        ? countrySettings.unblockedCountries
        : 'N/A',

    casino_blocked_regions:
      regionSettings?.casinoBlockedRegions?.trim()
        ? regionSettings.casinoBlockedRegions
        : 'N/A',

    unblocked_regions:
      regionSettings?.unblockedRegions?.trim()
        ? regionSettings.unblockedRegions
        : 'N/A',
  };
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
  'US', // United States
  'FR', // France
  'IL', // Israel
  'TW', // Taiwan
  'AU', // Australia
  'KP', // North Korea
  'IN', // India
  'SG', // Singapore
  'IR', // Iran
  'AE', // United Arab Emirates
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
     const marketType = this.getMarketType(
  playerCountry,
  playerRegion,
);
    return {
      category:
        'REGULATED_MARKET_BLOCK',

recommendation:
  `${playerCountry}/${playerRegion} is a ${marketType} country and playing from this country is not allowed as per brand settings. Please contact RNG Tech Support for further assistance.`
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
  const marketType = this.getMarketType(
    playerCountry,
    playerRegion,
  );

  return {
    category: 'PLATFORM_GEOIP_BLOCK',

    recommendation:
      `${playerCountry}/${playerRegion} is a ${marketType} country and playing from this country is not allowed as per brand settings. Please contact RNG Tech Support for further assistance.`,
  };
}

if (
  accessibleJurisdictions.length > 0 &&
  !explicitlyAllowed
) {
  const marketType =
    this.getMarketType(
      playerCountry,
      playerRegion,
    );

  return {
    category:
      'ACCESSIBLE_JURISDICTION_BLOCK',

    recommendation:
      `${playerCountry}/${playerRegion} is an ${marketType}. Unregulated markets are allowed by default unless explicitly restricted. However, this casino is configured with restricted Accessible Jurisdictions and the player's country/region is not included in the allowed list. Please contact RNG Tech Support for further assistance.`,
  };
}
   return {
  category: 'UNKNOWN_521',

  recommendation:
    `${playerCountry}/${playerRegion} is a ${this.getMarketType(
      playerCountry,
      playerRegion,
    )} country and is not blocked as per brand settings. The most likely reason is that the table is not certified or available for this jurisdiction under the current brand. Please contact RNG Tech Support for further assistance.`,
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
      const apiEnv = this.getApiEnv(env);

      const UCID = data.UCID;

      const finalCasinoId =
        this.extractCasinoId(casinoId);

      const path =
        `/RGSGateway/GameAPI/getCasinoGames/${finalCasinoId}/`;

      let url =
    `${this.getBaseApiUrl(apiEnv)}${path}`;

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
  this.getRgsSecret(),
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
    `${this.getFallbackApiUrl(apiEnv)}${path}`;

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
    `${this.getFallbackApiUrl(apiEnv)}${path}`;

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
    const apiEnv = this.getApiEnv(env);

    const UCID = data.UCID;

    const path =
      '/RGSGateway/CommonAPI/casino/configurations';

  let url =
    `${this.getBaseApiUrl(apiEnv)}${path}`;

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
  this.getRgsSecret(),
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
    `${this.getFallbackApiUrl(apiEnv)}${path}`;

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
      `${this.getFallbackApiUrl(apiEnv)}${path}`;

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
  // matcjhing shared env in logs//
private platformCasinoMatches(
  casinoId: string,
  shardedEnv: any[],
  log: any,
): boolean {

  const platformCasinoId =
    String(log?.app?.casinoID || '')
      .replace(/,/g, '')
      .trim();

  const stage =
    String(log?.stage || '')
      .trim()
      .toLowerCase();

  const directMatch =
    this.casinoMatches(
      casinoId,
      platformCasinoId,
    );

  const shardedMatch =
    shardedEnv.some(
      (x: any) =>
        String(x.shardedCasinoId)
          .replace(/,/g, '')
          .trim() === platformCasinoId &&
        stage.includes(
          String(x.env_name)
            .trim()
            .toLowerCase(),
        ),
    );

  console.log(
    'PLATFORM MATCH',
    {
      casinoId,
      platformCasinoId,
      stage,
      directMatch,
      shardedMatch,
    },
  );

  return directMatch || shardedMatch;
}
//When only playfrom logs present extract casino uisng slot logs//
private async resolveCasinoFromPlatformLogs(
  platformLogs: any[],
): Promise<string | null> {

  for (const log of platformLogs) {

    const platformCasinoId =
      String(
        log?.app?.casinoID || '',
      ).trim();

    const envName =
      String(
        log?.stage || '',
      )
        .replace(/^prod/i, '')
        .trim()
        .toLowerCase();

    if (!platformCasinoId || !envName) {
      continue;
    }

    console.log(
      'PLATFORM LOOKUP',
      {
        platformCasinoId,
        envName,
      },
    );

    // Main OWC lookup
    const mainResult: any =
  await this.repository
    .findCasinoByPlatformIdAndEnv(
      platformCasinoId,
      envName,
    );

    let casinoId =
      mainResult?.recordset?.[0]
        ?.casino_id;

    if (casinoId) {
      console.log(
        'CASINO FOUND IN OWC',
        casinoId,
      );

      return String(casinoId);
    }

    // Sharded lookup
 const shardedResult: any =
  await this.repository
    .findShardedCasinoByPlatformIdAndEnv(
      platformCasinoId,
      envName,
    );
    casinoId =
      shardedResult?.recordset?.[0]
        ?.casino_id;

    if (casinoId) {
      console.log(
        'CASINO FOUND IN SHARDED OWC',
        casinoId,
      );

      return String(casinoId);
    }
  }

  return null;
}

  //Common Helper//
  private buildSessionMaps(logs: any[]) {
    const uuidGameMap =
      new Map<string, string>();

    const uuidCasinoMap =
      new Map<string, string>();

 

      const uuidProcessRequestGameMap =
  new Map<string, string>();


    for (const log of logs) {
      const uuid =
        log?.contextMap?.uuid ||
        log?.contextMap?.['uuid:'];

      const ppenv =
        log?.contextMap?.ppenv;

      if (!uuid && !ppenv) {
        continue;
      }

      const text = [
        log?.message,
        log?.requestLog,
        log?.responseLog,
      ]
        .filter(Boolean)
        .join(' ');

  const isProcessRequest =
  text.includes('processRequest GET query string');

const gameId =
  text.match(/gameid=(\d+)/i)?.[1] ||
  text.match(/"gameID":"([^"]+)"/)?.[1] ||
  text.match(/"operatorGameId":"([^"]+)"/)?.[1] ||
  text.match(/"ppGame":"([^"]+)"/)?.[1];
 

      const casinoId =
        log?.contextMap?.casinoId;

   if (
  !isProcessRequest &&
  uuid &&
  gameId &&
  !uuidGameMap.has(uuid)
) {
  uuidGameMap.set(
    uuid,
    String(gameId),
  );
}


if (
  isProcessRequest &&
  uuid &&
  gameId &&
  !uuidProcessRequestGameMap.has(uuid)
) {
  uuidProcessRequestGameMap.set(
    uuid,
    String(gameId),
  );
}

      if (
        uuid &&
        casinoId &&
        !uuidCasinoMap.has(uuid)
      ) {
        uuidCasinoMap.set(
          uuid,
          String(casinoId),
        );
      }
    }

 return {
  uuidGameMap,
  uuidCasinoMap,
    uuidProcessRequestGameMap,
};
  }
 //Launch Fail Logs mapping//
 private async buildLaunchFailureMap(
  logs: any[],
  uuidGameMap: Map<string, string>,
  uuidProcessRequestGameMap: Map<string, string>,
  uuidCasinoMap: Map<string, string>,
  ppenvCasinoMap: Map<string, string>,
  styleNameCasinoMap: Map<string, string>,
  dbCasinoMap: Map<string, string>,
) {
  const launchFailureMap =
    new Map<string, boolean>();

    const hasLcLogs =
  logs.some(
    (x: any) =>
      !x?._index?.startsWith(
        'filebeat-slots',
      ),
  );


  for (const log of logs) {

    console.log(
      'PROCESSING LOG',
    );


console.log(
  'FAILURE LOG RAW',
  JSON.stringify(
    {
      serviceMethod:
        log?.serviceMethod,
      appServiceMethod:
        log?.app?.serviceMethod,
      game:
        log?.app?.game,
      casinoID:
        log?.app?.casinoID,
      message:
        log?.message?.substring(0, 500),
    },
    null,
    2,
  ),
);

    const text = [
      log?.message,
      log?.requestLog,
      log?.responseLog,
      log?.error,
    ]
      .filter(Boolean)
      .join(' ');

    // =====================================
    // USER API CHECK
    // =====================================
const platformGameId = String(
  log?.app?.game ||
  text.match(/"game":"([^"]+)"/)?.[1] ||
  '',
);

const isLobbyGame =
  !!this.GAME_NAME_OVERRIDE[
    platformGameId
  ];
console.log(
  'FAILURE LOG COUNT:',
  logs.length,
);

const isUserApi =
  text.includes(
    '/RGSGateway/UserAPI/',
  );

const isPlatformAuthenticate =
  log?.serviceMethod === 'AUTHENTICATE' ||
  log?.app?.serviceMethod === 'AUTHENTICATE' ||
  text.includes(
    '"serviceMethod":"AUTHENTICATE"',
  ) ||
  text.includes(
    'serviceMethod":"AUTHENTICATE"',
  );

  console.log(
  'LOG TYPE CHECK',
  {
    isLobbyGame,
    isUserApi,
    isPlatformAuthenticate,
  },
);

// Normal tables -> LC UserAPI
// Lobby games -> Platform Authenticate


if (isLobbyGame) {

  // Old customers
  if (
    hasLcLogs &&
    !isUserApi
  ) {
    continue;
  }

  // Merged customers
  if (
    !hasLcLogs &&
    !isPlatformAuthenticate
  ) {
    continue;
  }

} else {

  if (!isUserApi) {
    continue;
  }

}
    // =====================================
    // ERROR CODE DEBUG
    // =====================================

let errorCode =
  this.extractErrorCodeFromText(text);

if (
  errorCode === null &&
  isLobbyGame
) {
  try {
    const response = JSON.parse(
      log?.app?.responseLog?.log || '{}',
    );

    errorCode = Number(response.error);
  } catch {}
}
 
    // Ignore successful auth
    if (
      errorCode === null ||
      errorCode === 0
    ) {
      console.log(
        'SKIPPED DUE TO ERROR CODE:',
        errorCode,
      );

      continue;
    }
    const uuid =
      log?.contextMap?.uuid ||
      log?.contextMap?.['uuid:'];



 let gameId =
  this.resolveGameId(
    log,
    uuidGameMap,
    uuidProcessRequestGameMap,
  );

if (!gameId && isLobbyGame) {
  gameId = platformGameId;
}
    console.log(
      'RESOLVED GAME ID:',
      gameId,
    );

let casinoId =
  this.resolveLcCasinoId(
    log,
    uuidCasinoMap,
    ppenvCasinoMap,
    styleNameCasinoMap,
    dbCasinoMap,
  );

  if (
  !casinoId &&
  isLobbyGame &&
  isPlatformAuthenticate
) {
  casinoId =
    await this.resolveCasinoFromPlatformLogs([
      log,
    ]);

  console.log(
    'PLATFORM CASINO FALLBACK',
    casinoId,
  );
}


  if (!gameId || !casinoId) {

  console.log(
    'FAILURE MAP SKIP REASON',
    {
      errorCode,
      gameId,
      casinoId,
      uuid,
      platformCasinoId: log?.app?.casinoID,
      serviceMethod:
        log?.serviceMethod,
      appServiceMethod:
        log?.app?.serviceMethod,
      stage:
        log?.stage,
    },
  );

  console.log(
    'LAUNCH FAILURE SKIPPED',
    {
      uuid,
      gameId,
      casinoId,
    },
  );

  continue;
}
    console.log(
      'LAUNCH FAILURE RESOLVED:',
      {
        uuid,
        gameId,
        casinoId,
      },
    );

    console.log(
      'ADDING TO FAILURE MAP:',
      `${casinoId}_${gameId}`,
    );

    launchFailureMap.set(
      `${casinoId}_${gameId}`,
      true,
    );
  }

  return launchFailureMap;
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

    const baseGameId =
    parsed.symbol.match(/^\d+/)?.[0] ||
    parsed.symbol;

    const blockedCountriesResponse =
    await this.repository.getLcBlockedCountries([
      baseGameId,
    ]);

    const lcBlockedCountryMap =
    new Map<string, any[]>();

  for (const row of (blockedCountriesResponse?.recordset || []) as any[]) {
    const key = String(
      row.operator_game_id,
    );

    if (!lcBlockedCountryMap.has(key)) {
      lcBlockedCountryMap.set(key, []);
    }

    lcBlockedCountryMap.get(key)?.push({
      country_name: row.name,
      country_code: row.country_code,
    });
  }

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

  const uuids = [
    ...new Set(
      rawLogs
        .map((x: any) =>
          getUUID(x),
        )
        .filter(Boolean),
    ),
  ] as string[];

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


    // =====================================================
    // ✅ STEP 4: CONFIG DETECTION (IMPROVED ✅)
    // =====================================================

  const logsToCheck = Array.from(
    new Map(
      [...rawLogs, ...uuidLogs].map(
        (log: any) => [
          log._id,
          log,
        ],
      ),
    ).values(),
  );

  console.log(
    'COMBINED LOG COUNT:',
    logsToCheck.length,
  );
const {
  uuidGameMap,
  uuidCasinoMap,
  uuidProcessRequestGameMap,
} = this.buildSessionMaps(
  logsToCheck,
);

  console.log(
    'UUID GAME MAP:',
    Array.from(uuidGameMap.entries()),
  );
console.log(
  'UUID PROCESS REQUEST GAME MAP:',
  Array.from(
    uuidProcessRequestGameMap.entries(),
  ),
);
  console.log(
    'UUID CASINO MAP:',
    Array.from(uuidCasinoMap.entries()),
  );

  let fullLogs: any[] = [];

  fullLogs =
    await this.repository.searchAllLogsByToken({
      token: token || '',
      from,
      to,
    });




  console.log(
    'FIRST LOG CASINO ID:',
    fullLogs[0]?.contextMap?.casinoId,
  );

  const ppenvCasinoMap =
    this.buildPpenvCasinoMap(
      [...fullLogs, ...logsToCheck],
    );

  console.log(
    'PPENV CASINO MAP:',
    Array.from(
      ppenvCasinoMap.entries(),
    ),
  );

  const styleNameCasinoMap =
  this.buildStyleNameCasinoMap(
    [...fullLogs, ...logsToCheck],
  );
const dbCasinoMap =
  await this.buildStyleNamePpenvCasinoMap(
    [...fullLogs, ...logsToCheck],
  );

  console.log(
  'DB CASINO MAP SIZE:',
  dbCasinoMap.size,
);

console.log(
  'DB CASINO MAP:',
  Array.from(dbCasinoMap.entries()),
);
  console.log(
  'STYLENAME CASINO MAP SIZE:',
  styleNameCasinoMap.size,
);


console.log(
  'STYLENAME CASINO MAP:',
  Array.from(
    styleNameCasinoMap.entries(),
  ),
);

const allLogsForFailureCheck = Array.from(
  new Map(
    [...logsToCheck, ...fullLogs].map(
      (x: any) => [x._id, x],
    ),
  ).values(),
);

const launchFailureMap =
  await this.buildLaunchFailureMap(
    allLogsForFailureCheck,
    uuidGameMap,
    uuidProcessRequestGameMap,
    uuidCasinoMap,
    ppenvCasinoMap,
    styleNameCasinoMap,
    dbCasinoMap,
  );

  const hasLogsMap =
  this.buildHasLogsMap(
    allLogsForFailureCheck,
    uuidGameMap,
    uuidProcessRequestGameMap,
    uuidCasinoMap,
    ppenvCasinoMap,
    styleNameCasinoMap,
    dbCasinoMap,
  );

  const matchedCasinoId =
    logsToCheck.find(
      (x: any) =>
        x?.contextMap?.casinoId,
    )?.contextMap?.casinoId || null;

    if (
    casinos.length === 0 &&
    matchedCasinoId
  ) {
    const casinoDetails =
      await this.repository.getCasinoDetails(
        matchedCasinoId,
      );

    const dbCasino: any =
      casinoDetails?.recordset?.[0];

      console.log(
  'DB CASINO DETAILS:',
  JSON.stringify(dbCasino, null, 2),
);

    casinos = [
      {
        casino_id:
          matchedCasinoId,

        casino_desc:
          dbCasino?.casino_desc || '',

        active_flag: null,

        env:
          dbCasino?.env || '',

        ucid:
          dbCasino?.UCID || '',
          wallet_type:
        dbCasino?.Wallet_Type || '',
      },
    ];
  }
  console.log(
  'CASINO OBJECT:',
  JSON.stringify(casinos, null, 2),
);

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
  log?.contextMap?.['uuid:'];

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
const hasLcLogs =
  lcLogs.length > 0;

const isLobbyGame =
  !!this.GAME_NAME_OVERRIDE[
    parsed.symbol.match(/^\d+/)?.[0] ||
    parsed.symbol
  ];

console.log({
  hasLcLogs,
  isLobbyGame,
});

  const noLogsFound =
    platformLogs.length === 0 &&
    lcLogs.length === 0;

  console.log(
    'NO LOGS FOUND:',
    noLogsFound,
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
  let matchedCasinoConfig: any = null;

  if (casinos.length === 1) {
    platformConfig =
      await this.getCasinoPlatformConfig(
        casinos[0].casino_id,
      );

    const targetCasinoId =
      this.extractCasinoId(
        casinos[0].casino_id,
      );

  matchedCasinoConfig =
    platformConfig?.data?.casinoConfigurations?.find(
      (x: any) =>
        Number(x.casinoID) ===
        Number(targetCasinoId),
    );

  }




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
    
  const jurisdictionSettings =
    matchedCasinoConfig?.configuration
      ?.jurisdictionSettings;

  const countrySettings =
    matchedCasinoConfig?.configuration
      ?.countrySettings;

  const regionSettings =
    matchedCasinoConfig?.configuration
      ?.regionSettings;

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
  /*
  else if (
    noLogsFound &&
    parsed.country &&
    casinos.length === 1
  ) {
    console.log(
      'RUNNING NO LOG COUNTRY ANALYSIS:',
      parsed.country,
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

  const analysis =
    this.analyze521(
      parsed.country,
      '',
      jurisdictionSettings,
      countrySettings,
      regionSettings,
    );

  console.log(
    'NO LOG ANALYSIS:',
    analysis,
  );


  this.pushTableConfigEvent(
    tableConfigEventMap,
    parsed.symbol,
    {
      timestamp: '',

      player_ip: '',

      player_country:
        parsed.country,

      player_region: '',

      session_id: '',

      lc_level_block: false,

      block_level:
        'PLATFORM',

      recommendation:
        analysis.recommendation,

      prohibited_message:
        'No logs were found on either the Platform or LC side for the provided launch URL. The table is enabled on both Platform and LC. Based on the available information, this appears to be a jurisdiction-related  specific to this table. Please contact RNG Tech Support for further investigation.',
    },
  );

  }
  */

  const casinoData: any[] = [];

  for (const casino of casinos) {


    let casinoPlatformConfig: any = [];

    const casinoTableConfigEventMap =
    new Map<string, any[]>();

    const shardedEnvResponse =
  await this.repository.getShardedCasinoMappings(
    casino.casino_id,
  );

const shardedEnv =
  (shardedEnvResponse?.recordset || []).map(
    (row: any) => ({
      env_id: row.env_id,
      env_name: String(row.env_name),
      shardedCasinoId:
        row.shardedCasinoId,
    }),
  );

console.log(
  'SHARDED ENV:',
  casino.casino_id,
  shardedEnv,
);

    for (const [
    key,
    value,
  ] of tableConfigEventMap.entries()) {
    casinoTableConfigEventMap.set(
      key,
      [...value],
    );
  }

  try {
    const platformConfig =
      await this.getCasinoPlatformConfig(
        casino.casino_id,
      );

    const targetCasinoId =
      this.extractCasinoId(
        casino.casino_id,
      );

  matchedCasinoConfig =
    platformConfig?.data?.casinoConfigurations?.find(
      (x: any) =>
        Number(x.casinoID) ===
        Number(targetCasinoId),
    );



    casinoPlatformConfig =
      this.populatePlatformConfigInfo(
        matchedCasinoConfig,
      );

  if (
    noLogsFound &&
    parsed.country
  ) {
    const analysis =
      this.analyze521(
        parsed.country,
        '',
        matchedCasinoConfig?.configuration
          ?.jurisdictionSettings,
        matchedCasinoConfig?.configuration
          ?.countrySettings,
        matchedCasinoConfig?.configuration
          ?.regionSettings,
      );

    this.pushTableConfigEvent(
      casinoTableConfigEventMap,
      parsed.symbol,
      {
        timestamp: '',
        player_ip: '',
        player_country: parsed.country,
        player_region: '',
        session_id: '',
        lc_level_block: false,
        block_level: 'PLATFORM',
        recommendation:
          analysis.recommendation,
        prohibited_message:
          'No logs were found on either the Platform or LC side for the provided launch URL. The table is enabled on both Platform and LC. Based on the available information, this appears to be a jurisdiction-related restriction specific to this table. Please contact RNG Tech Support for further investigation.'
      },
    );
  }

  } catch (error) {
    casinoPlatformConfig = [];
  }

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
  const launchedGameIds =
    new Set([parsed.symbol]);

  const result =
    this.buildCasinoResult(
      casino,
      parsed.symbol,
      tableConfig,
      tableFamily,
      lcTables,
      platformGames,
      lcBlockedCountryMap,
      launchedGameIds,
      launchFailureMap,
      hasLogsMap,
    );

    let ucidConfigErrors: any[] = [];
    if (result?.ucid) {
    try {
      const ucidLogs =
        await this.repository.searchCasinoMappingErrors({
          ucId: String(result.ucid),
          from,
          to,
        });

      ucidConfigErrors =
        (ucidLogs || []).map(
          (log: any) => ({
            timestamp:
              log?.['@timestamp'] || '',

            message:
              log?.message || '',
          }),
        );
    } catch (error: any) {
      ucidConfigErrors = [
        {
          timestamp:
            new Date().toISOString(),

          message:
            'Merged Lobby config error check timed out. If required, please check filebeat-live logs manually.',
        },
      ];
    }
  }
const casinoPlatformLogs =
  platformLogs.filter(
    (log: any) =>
      this.platformCasinoMatches(
        casino.casino_id,
        shardedEnv,
        log,
      ),
  );
  const casinoLcLogsResolved =
  lcLogs.map((log: any) => {
    const resolvedCasinoId =
      this.resolveLcCasinoId(
        log,
        uuidCasinoMap,
        ppenvCasinoMap,
        styleNameCasinoMap,
        dbCasinoMap,
      );

    return {
      ...log,
      contextMap: {
        ...log.contextMap,
        resolvedCasinoId,
      },
    };
  });

const casinoLcLogs =
  casinoLcLogsResolved.filter(
    (log: any) =>
      `${log.contextMap.resolvedCasinoId}` ===
      `${casino.casino_id}`,
  );

  const tableInfoWithConfig =
    this.attachTableConfigEvents(
      result.table_info,
      casinoTableConfigEventMap,
    );

console.log(
  'WALLET TYPE BEFORE RESPONSE:',
  casino.wallet_type,
);

  casinoData.push({
    casino_id:
      result.casino_id,

    casino_desc:
      result.casino_desc,

    env_name:
      result.env_name,

    ucid:
      result.ucid,

    casino_active_flag:
      result.casino_active_flag,
      sharded_env: shardedEnv,
      wallet_type:
      casino.wallet_type || '',

    config_error: [
      ...configErrors,
      ...ucidConfigErrors,
    ],

  platform_config:
    casinoPlatformConfig,

    table_info:
      tableInfoWithConfig,

    log_info: [
      {
        log_type:
          'PLATFORM',

      logs: this.mapLogs(
  casinoPlatformLogs,
  uuidGameMap,
  uuidProcessRequestGameMap,
)
      },

      {
        log_type:
          'LC',

      logs: this.mapLogs(
  casinoLcLogs,
  uuidGameMap,
  uuidProcessRequestGameMap,
)
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

    const investigationStart =
    Date.now();

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
    const logsToCheck = Array.from(
    new Map(
      [...fullLogs, ...uuidLogs].map(
        (log: any) => [
          log._id,
          log,
        ],
      ),
    ).values(),
  );

  console.log(
    'COMBINED LOG COUNT:',
    logsToCheck.length,
  );
const {
  uuidGameMap,
  uuidCasinoMap,
  uuidProcessRequestGameMap,
} = this.buildSessionMaps(
  logsToCheck,
);

  console.log(
    'UUID GAME MAP:',
    Array.from(uuidGameMap.entries()),
  );
  console.log(
  'UUID PROCESS REQUEST GAME MAP:',
  Array.from(
    uuidProcessRequestGameMap.entries(),
  ),
);

  console.log(
    'UUID CASINO MAP:',
    Array.from(uuidCasinoMap.entries()),
  );

  const ppenvCasinoMap =
    this.buildPpenvCasinoMap(
      [...fullLogs, ...logsToCheck],
    );

  console.log(
    'PPENV CASINO MAP:',
    Array.from(
      ppenvCasinoMap.entries(),
    ),
  );

const styleNameCasinoMap =
  this.buildStyleNameCasinoMap(
    [...fullLogs, ...logsToCheck],
  );

  const dbCasinoMap =
  await this.buildStyleNamePpenvCasinoMap(
    [...fullLogs, ...logsToCheck],
  );

  console.log(
  'DB CASINO MAP SIZE:',
  dbCasinoMap.size,
);

console.log(
  'DB CASINO MAP:',
  Array.from(dbCasinoMap.entries()),
);
  console.log(
  'STYLENAME CASINO MAP SIZE:',
  styleNameCasinoMap.size,
);

console.log(
  'STYLENAME CASINO MAP:',
  Array.from(
    styleNameCasinoMap.entries(),
  ),
);

const allLogsForFailureCheck = Array.from(
  new Map(
    [...logsToCheck, ...fullLogs].map(
      (x: any) => [x._id, x],
    ),
  ).values(),
);

const launchFailureMap =
  await this.buildLaunchFailureMap(
    allLogsForFailureCheck,
    uuidGameMap,
    uuidProcessRequestGameMap,
    uuidCasinoMap,
    ppenvCasinoMap,
    styleNameCasinoMap,
    dbCasinoMap,
  );

  console.log(
    'LAUNCH FAILURE MAP:',
    Array.from(
      launchFailureMap.entries(),
    ),
  );

const hasLogsMap =
  this.buildHasLogsMap(
    allLogsForFailureCheck,
    uuidGameMap,
    uuidProcessRequestGameMap,
    uuidCasinoMap,
    ppenvCasinoMap,
    styleNameCasinoMap,
    dbCasinoMap,
  );

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
  log?.contextMap?.['uuid:'];

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

let uniqueGameIds = [
  ...new Set(
    logsToCheck
      .map((log: any) => {
        const text = [
          log?.message,
          log?.requestLog,
          log?.responseLog,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          text.match(/gameid=(\d+)/i)?.[1] ||
          text.match(/"gameID":"([^"]+)"/)?.[1] ||
          text.match(/"operatorGameId":"([^"]+)"/)?.[1] ||
          text.match(/"ppGame":"([^"]+)"/)?.[1]
        );
      })
      .filter(Boolean),
  ),
];



    console.log(
      'UNIQUE GAME IDS:',
      uniqueGameIds,
    );

    const baseGameIds = [
    ...new Set(
      (uniqueGameIds as string[]).map(
        (gameId) =>
          gameId.match(/^\d+/)?.[0] ||
          gameId,
      ),
    ),
  ];

  console.log(
    'BASE GAME IDS:',
    baseGameIds,
  );

  let launchedGameIds =
  new Set(
    uniqueGameIds.map(String),
  );

  const blockedCountriesResponse =
    baseGameIds.length > 0
      ? await this.repository.getLcBlockedCountries(
          baseGameIds,
        )
      : { recordset: [] };

    const lcBlockedCountryMap =
    new Map<string, any[]>();

  for (
    const row of (
      blockedCountriesResponse?.recordset || []
    ) as any[]
  ) {
    const key = String(
      row.operator_game_id,
    );

    if (!lcBlockedCountryMap.has(key)) {
      lcBlockedCountryMap.set(key, []);
    }

    lcBlockedCountryMap.get(key)?.push({
      country_name: row.name,
      country_code: row.country_code,
    });
  }
const resolvedCasinoIds =
  logsToCheck.map((log: any) =>
    this.resolveLcCasinoId(
      log,
      uuidCasinoMap,
      ppenvCasinoMap,
      styleNameCasinoMap,
      dbCasinoMap,
    ),
  );
  
const casinoIdsFromLogs = [
  ...new Set(
    resolvedCasinoIds.filter(Boolean),
  ),
];

let casinos: any[] = [];

let matchedCasinoId =
  casinoIdsFromLogs[0] || null;

  console.log(
    'CASINOS FOUND IN LOGS =>',
    casinoIdsFromLogs,
  );

  console.log(
    'CASINO COUNT =>',
    casinoIdsFromLogs.length,
  );


  if (matchedCasinoId) {
    const casinoDetails =
      await this.repository.getCasinoDetails(
        matchedCasinoId,
      );

  const dbCasino: any =
    casinoDetails?.recordset?.[0];

    console.log(
  'DB CASINO DETAILS:',
  JSON.stringify(dbCasino, null, 2),
);

    console.log(
    'DB CASINO DETAILS:',
    JSON.stringify(dbCasino),
  );
  casinos = [
    {
      casino_id: matchedCasinoId,

    casino_desc:
    dbCasino?.casino_desc || '',

      active_flag: null,

      env:
        dbCasino?.env || '',

      ucid:
        dbCasino?.UCID || '',
        wallet_type:
        dbCasino?.Wallet_Type || '',
    },
  ];
  }

  console.log(
  'CASINO OBJECT:',
  JSON.stringify(casinos, null, 2),
);

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

      console.log(
  'PLATFORM LOG COUNT:',
  platformLogs.length,
);

console.log(
  'LC LOG COUNT:',
  lcLogs.length,
);


if (
  uniqueGameIds.length === 0 &&
  lcLogs.length === 0 &&
  platformLogs.length > 0
) {
  uniqueGameIds.push(
    ...[
      ...new Set(
        platformLogs
          .map((log: any) => {
            const text = [
              log?.message,
              log?.requestLog,
              log?.responseLog,
            ]
              .filter(Boolean)
              .join(' ');

            return text.match(
              /"game":"([^"]+)"/i,
            )?.[1];
          })
          .filter(Boolean),
      ),
    ],
  );

  console.log(
    'PLATFORM ONLY GAME IDS:',
    uniqueGameIds,
  );
}

launchedGameIds.clear();

uniqueGameIds.forEach((gameId) =>
  launchedGameIds.add(String(gameId)),
);

console.log(
  'LAUNCHED GAME IDS AFTER FALLBACK:',
  Array.from(launchedGameIds),
);


if (
  casinoIdsFromLogs.length === 0 &&
  lcLogs.length === 0 &&
  platformLogs.length > 0
) {
  console.log(
    'NO LC LOGS FOUND. ATTEMPTING PLATFORM-ONLY CASINO RESOLUTION',
  );

  const platformCasinoId =
    await this.resolveCasinoFromPlatformLogs(
      platformLogs,
    );

if (platformCasinoId) {
  casinoIdsFromLogs.push(
    platformCasinoId,
  );

  matchedCasinoId =
    casinoIdsFromLogs[0] || null;

  console.log(
    'CASINO RESOLVED FROM PLATFORM LOGS:',
    platformCasinoId,
  );
}
}

if (
  casinos.length === 0 &&
  matchedCasinoId
) {
  const casinoDetails =
    await this.repository.getCasinoDetails(
      matchedCasinoId,
    );

  const dbCasino: any =
    casinoDetails?.recordset?.[0];

  if (dbCasino) {
    casinos = [
      {
        casino_id: matchedCasinoId,

        casino_desc:
          dbCasino?.casino_desc || '',

        active_flag: null,

        env:
          dbCasino?.env || '',

        ucid:
          dbCasino?.UCID || '',

        wallet_type:
          dbCasino?.Wallet_Type || '',
      },
    ];
  }

  console.log(
    'PLATFORM RESOLVED CASINO OBJECT:',
    JSON.stringify(casinos, null, 2),
  );
}

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
  let platformConfigInfo: any = [];
  let matchedCasinoConfig: any = null;
  if (casinos.length === 1) {
    platformConfig =
      await this.getCasinoPlatformConfig(
        casinos[0].casino_id,
      );

  console.log(
    'PLATFORM CONFIG SUCCESS:',
    platformConfig?.success,
  );

  console.log(
    'PLATFORM CONFIG MESSAGE:',
    platformConfig?.message,
  );

  console.log(
    'CASINO CONFIGURATIONS EXISTS:',
    !!platformConfig?.data?.casinoConfigurations,
  );

  console.log(
  'CASINO CONFIGURATIONS COUNT:',
  platformConfig?.data
    ?.casinoConfigurations
    ?.length,
);

    const targetCasinoId =
      this.extractCasinoId(
        casinos[0].casino_id,
      );

      console.log(
  'TARGET CASINO ID:',
  targetCasinoId,
);

  matchedCasinoConfig =
    platformConfig?.data?.casinoConfigurations?.find(
      (x: any) =>
        Number(x.casinoID) ===
        Number(targetCasinoId),
    );

        console.log(
    'MATCHED CASINO CONFIG FOUND:',
    !!matchedCasinoConfig,
  );

  console.log(
  'MATCHED CASINO CONFIG FULL:',
  JSON.stringify(
    matchedCasinoConfig,
    null,
    2,
  ),
);

console.log(
  'HAS CONFIGURATION:',
  !!matchedCasinoConfig?.configuration,
);


console.log(
  'JURISDICTION SETTINGS RAW:',
  JSON.stringify(
    matchedCasinoConfig?.configuration
      ?.jurisdictionSettings,
    null,
    2,
  ),
);

console.log(
  'COUNTRY SETTINGS RAW:',
  JSON.stringify(
    matchedCasinoConfig?.configuration
      ?.countrySettings,
    null,
    2,
  ),
);

console.log(
  'REGION SETTINGS RAW:',
  JSON.stringify(
    matchedCasinoConfig?.configuration
      ?.regionSettings,
    null,
    2,
  ),
);

  console.log(
    'TARGET CASINO ID:',
    targetCasinoId,
  );

  console.log(
    'PLATFORM CONFIG COUNT:',
    platformConfig?.data?.casinoConfigurations?.length,
  );

  console.log(
    'MATCHED CASINO CONFIG:',
    JSON.stringify(matchedCasinoConfig),
  );

    platformConfigInfo =
      this.populatePlatformConfigInfo(
        matchedCasinoConfig,
      );

      console.log(
    'MATCHED CASINO CONFIG FOUND:',
    !!matchedCasinoConfig,
  );

  console.log(
    'TARGET CASINO ID:',
    targetCasinoId,
  );

  console.log(
    'PLATFORM CONFIG COUNT:',
    platformConfig?.data?.casinoConfigurations?.length,
  );

  console.log(
    'MATCHED CASINO CONFIG:',
    JSON.stringify(matchedCasinoConfig),
  );
  }
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
    
    const jurisdictionSettings =
    matchedCasinoConfig?.configuration
      ?.jurisdictionSettings;

  const countrySettings =
    matchedCasinoConfig?.configuration
      ?.countrySettings;

  const regionSettings =
    matchedCasinoConfig?.configuration
      ?.regionSettings;


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
        let ucidConfigErrors: any[] = [];

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

    const shardedEnvResponse =
  await this.repository.getShardedCasinoMappings(
    casino.casino_id,
  );

const shardedEnv =
  (shardedEnvResponse?.recordset || []).map(
    (row: any) => ({
      env_id: row.env_id,
      env_name: String(row.env_name),
      shardedCasinoId:
        row.shardedCasinoId,
    }),
  );

console.log(
  'SHARDED ENV:',
  casino.casino_id,
  shardedEnv,
);

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
      lcBlockedCountryMap,
      launchedGameIds,
      launchFailureMap,
      hasLogsMap,
    );

        if (!firstResult) {
          firstResult =
            result;
        }

        tableInfo.push(
          ...result.table_info,
        );
      }

      console.log(
    'FIRST RESULT UCID:',
    firstResult?.ucid,
  );

  console.log(
    'TYPE OF UCID:',
    typeof firstResult?.ucid,
  );

  // Fetch UCID mapping errors once per casino//
  const ucidToSearch =
    casino?.ucid ||
    firstResult?.ucid;

  console.log(
    'UCID USED FOR SEARCH:',
    ucidToSearch,
  );

  if (ucidToSearch) {
    try {
      const ucidLogs =
        await this.repository.searchCasinoMappingErrors({
          ucId: String(ucidToSearch),
          from,
          to,
        });

      ucidConfigErrors =
        (ucidLogs || []).map(
          (log: any) => ({
            timestamp:
              log?.['@timestamp'] || '',

            message:
              log?.message || '',
          }),
        );
    } catch (error: any) {
      ucidConfigErrors = [
        {
          timestamp:
            new Date().toISOString(),

          message:
            'Merged Lobby config error check timed out. If required, please check filebeat-live logs manually.',
        },
      ];
    }
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
      this.platformCasinoMatches(
        casino.casino_id,
        shardedEnv,
        log,
      ),
  );
 const casinoLcLogsResolved =
  lcLogs.map((log: any) => {
    const resolvedCasinoId =
      this.resolveLcCasinoId(
        log,
        uuidCasinoMap,
        ppenvCasinoMap,
        styleNameCasinoMap,
        dbCasinoMap,
      );

    return {
      ...log,
      contextMap: {
        ...log.contextMap,
        resolvedCasinoId,
      },
    };
  });

const casinoLcLogs =
  casinoLcLogsResolved.filter(
    (log: any) =>
      `${log.contextMap.resolvedCasinoId}` ===
      `${casino.casino_id}`,
  );
console.log(
  'WALLET TYPE BEFORE RESPONSE:',
  casino.wallet_type,
);

      casinoData.push({
        casino_id:
          casino.casino_id,

        casino_desc:
          casino.casino_desc,

    env_name:
    firstResult?.env_name ||
    casino.env ||
    '',

  ucid:
    firstResult?.ucid ||
    casino.ucid ||
    '',
        casino_active_flag:
          casino.active_flag,
          sharded_env: shardedEnv,
          wallet_type:
          casino.wallet_type || '',
    config_error: [
    ...configErrors,
    ...ucidConfigErrors,
  ],

  platform_config:
    platformConfigInfo,

  table_info:
    uniqueTableInfoWithConfig,

        log_info: [
          {
            log_type:
              'PLATFORM',

            logs: this.mapLogs(
  casinoPlatformLogs,
  uuidGameMap,
  uuidProcessRequestGameMap,
)
          },

          {
            log_type:
              'LC',

          logs: this.mapLogs(
  casinoLcLogs,
  uuidGameMap,
  uuidProcessRequestGameMap,
)
          },
        ],
      });
    }
  const totalTime =
    Date.now() -
    investigationStart;

  console.log(
    'SESSION INVESTIGATION TOTAL TIME:',
    totalTime,
    'ms',
  );

  return {
    success: true,
    processing_time_ms:
    totalTime,

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
  lcBlockedCountryMap: Map<string, any[]>,
  launchedGameIds: Set<string>,
  launchFailureMap: Map<string, boolean>,
  hasLogsMap: Map<string, boolean>,
)
  {
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

  return {
    casino_id: casinoId,

    casino_desc:
      casino.casino_desc ||
      casino.email_address,

    env_name:
      platformGames?.env ||
      casino?.env ||
      '',

    ucid:
      platformGames?.UCID ||
      casino?.ucid ||
      '',

      casino_active_flag:
        casino.active_flag,
  table_info: [
  {
    is_base_table: true,
    has_logs:
  hasLogsMap.get(
    `${casinoId}_${baseFamily}`,
  ) || false,

   is_launched:
  launchedGameIds.has(
    String(baseFamily),
  ) ||
  launchFailureMap.has(
    `${casinoId}_${baseFamily}`,
  ),
  has_launch_failed: (() => {
    const key =
      `${casinoId}_${baseFamily}`;

    const value =
      launchFailureMap.get(key) ||
      false;

    console.log(
      'HAS_LAUNCH_FAILED_CHECK',
      {
        key,
        value,
        availableKeys: Array.from(
          launchFailureMap.keys(),
        ),
      },
    );

    return value;
  })(),

    base_table_id: baseFamily,

    operator_game_id: baseFamily,
    table_name: this.getGameDisplayName(
      baseFamily,
      tableConfig?.table_name ||
        tableFamily?.[0]?.table_name,
    ) || null,

      platform_enabled:
        games.some(
          (x: any) =>
            `${x.gameID}` ===
            `${baseFamily}`,
        ),

     lc_enabled:
  !!this.GAME_NAME_OVERRIDE[baseFamily]
    ? true
    : lcGameIds.includes(`${baseFamily}`),

  lc_blocked_countries:
      lcBlockedCountryMap.get(
        baseFamily,
      ) || [],

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
      has_logs:
  hasLogsMap.get(
    `${casinoId}_${table.operator_game_id}`,
  ) || false,

      is_launched:
        launchedGameIds.has(
          String(table.operator_game_id),
        ),

      has_launch_failed:
        launchFailureMap.get(
          `${casinoId}_${table.operator_game_id}`,
        ) || false,

    base_table_id: baseFamily,

    operator_game_id:
      table.operator_game_id,

    table_name: this.getGameDisplayName(
      String(table.operator_game_id),
      table.table_name,
    ),

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
            lc_blocked_countries: [],

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
    const parsed = new URL(url);

    return {
      type: 'OPEN_GAME',

      stylename:
        parsed.searchParams.get('stylename') || '',

      symbol:
        parsed.searchParams.get('symbol') || '',

      tc:
        parsed.searchParams.get('tc') || '',

      country:
        parsed.searchParams.get('country') || '',
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

          country:
    parsed.searchParams.get(
      'requestCountryCode',
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
  // PLATFORM LOG LEVEL
  // =====================================================
  private getPlatformLogLevel(
    log: any,
  ): string {
    const responseText =
      log?.app?.responseLog?.log;

    if (responseText) {
      try {
        const parsed =
          JSON.parse(responseText);

        const error =
          parsed?.error;

        return (
          error === 0 ||
          error === '0' ||
          error === null
        )
          ? 'SUCCESS'
          : 'ERROR';
      } catch {
        return 'ERROR';
      }
    }

    const httpErrorCode =
      Number(
        log?.app?.httpErrorCode,
      );

    return httpErrorCode === 200
      ? 'SUCCESS'
      : 'ERROR';
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


    private mapLogs(
  logs: any[],
  uuidGameMap: Map<string, string>,
  uuidProcessRequestGameMap: Map<string, string>,
) {
      return logs.map(
        (log: any) => ({
          _id:
            log?._id || '',

          _index:
            log?._index || '',
        log_level:
    log?._index?.startsWith(
      'filebeat-slots',
    )
      ? this.getPlatformLogLevel(
          log,
        )
      : this.getLcLogLevel(
          log,
        ),
        operator_game_id:
  this.resolveOperatorGameIdForLog(
    log,
    uuidGameMap,
    uuidProcessRequestGameMap,
  ),

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
