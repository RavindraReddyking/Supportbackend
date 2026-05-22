"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerBetLogsRepository = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let PlayerBetLogsRepository = class PlayerBetLogsRepository {
    headers() {
        return {
            'Content-Type': 'application/json',
            Accept: '*/*',
            'User-Agent': 'Mozilla/5.0',
            'kbn-xsrf': 'true',
            Authorization: `ApiKey ${process.env.KIBANA_API_KEY}`,
        };
    }
    async searchFilebeatLogs(params) {
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
        const res = await axios_1.default.post(process.env.KIBANA_URL, body, {
            headers: this.headers(),
            timeout: 65000,
        });
        return res.data?.hits?.hits?.map((x) => x._source) || [];
    }
    async searchRoundLogs(params) {
        return this.searchFilebeatLogs({
            query: `"${params.roundId}"`,
            from: params.from,
            to: params.to,
            size: 3000,
        });
    }
    async searchLateBetLogs(params) {
        return this.searchFilebeatLogs({
            query: `"ERROR : 1007 - LATE BET" AND "${params.gameId}" AND "${params.userId}"`,
            from: params.from,
            to: params.to,
            size: 500,
        });
    }
    async searchBlackjackGameLogs(params) {
        const query = `(
      ("${params.gameId}" AND "${params.userId}" AND "INCOMING message: <command channel=")
      OR
      ("${params.gameId}" AND timeout AND "On message")
      OR
      ("${params.gameId}" AND meta AND (decision OR decisioninc OR card))
      OR
      ("${params.userId}" AND "error-1007")
    )`;
        return this.searchFilebeatLogs({
            query,
            from: params.from,
            to: params.to,
            size: 3000,
        });
    }
    async searchBaccaratGameLogs(params) {
        const [byGameAndUser, byGameAndCard] = await Promise.all([
            this.searchFilebeatLogs({
                query: `"${params.gameId}" AND "${params.userId}"`,
                from: params.from,
                to: params.to,
                size: 2000,
            }),
            this.searchFilebeatLogs({
                query: `"${params.gameId}" AND card`,
                from: params.from,
                to: params.to,
                size: 2000,
            }),
        ]);
        return [...byGameAndUser, ...byGameAndCard];
    }
    async searchCrashGameLogs(params) {
        return this.searchFilebeatLogs({
            query: `"${params.gameId}"`,
            from: params.from,
            to: params.to,
            size: 3000,
            extraFilters: [
                {
                    query_string: {
                        query: `contextMap.userId:"${params.userId}"`,
                    },
                },
            ],
        });
    }
    async searchGenericGameLogs(params) {
        return this.searchFilebeatLogs({
            query: `"${params.gameId}" AND "${params.userId}"`,
            from: params.from,
            to: params.to,
            size: 2000,
        });
    }
};
exports.PlayerBetLogsRepository = PlayerBetLogsRepository;
exports.PlayerBetLogsRepository = PlayerBetLogsRepository = __decorate([
    (0, common_1.Injectable)()
], PlayerBetLogsRepository);
//# sourceMappingURL=player-bet-logs.repository.js.map