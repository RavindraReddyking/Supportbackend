"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerBetLogsService = void 0;
const common_1 = require("@nestjs/common");
const player_bet_logs_repository_1 = require("./player-bet-logs.repository");
let PlayerBetLogsService = class PlayerBetLogsService {
    constructor(repo) {
        this.repo = repo;
    }
    async getPlayerBetLogs(params) {
        const [roundLogs, lateLogs] = await Promise.all([
            this.repo.searchRoundLogs({
                roundId: params.roundId,
                from: params.from,
                to: params.to,
            }),
            this.repo.searchLateBetLogs({
                gameId: params.gameId,
                userId: params.userId,
                from: params.from,
                to: params.to,
            }),
        ]);
        return {
            success: true,
            count: 1,
            data: [
                {
                    roundId: params.roundId,
                    gameId: params.gameId,
                    userId: params.userId,
                    from: params.from,
                    to: params.to,
                    logs: [...roundLogs, ...lateLogs],
                },
            ],
        };
    }
    async getTransactionLogs(params) {
        const rawLogs = await this.repo.searchRoundLogs(params);
        return {
            success: true,
            roundId: params.roundId,
            lcTransactionLogs: this.mapGameApiLogs(rawLogs),
            platformLogs: this.mapPlatformLogs(rawLogs),
        };
    }
    async getGameLogs(params) {
        let rawLogs = [];
        switch (params.gameType) {
            case 'BLACKJACK':
                rawLogs = await this.repo.searchBlackjackGameLogs(params);
                break;
            case 'BACCARAT':
                rawLogs = await this.repo.searchBaccaratGameLogs(params);
                break;
            case 'CRASH':
                rawLogs = await this.repo.searchCrashGameLogs(params);
                break;
            default:
                rawLogs = await this.repo.searchGenericGameLogs(params);
                break;
        }
        return {
            success: true,
            gameId: params.gameId,
            userId: params.userId,
            gameType: params.gameType,
            gameLogs: this.mapGameLogs(rawLogs),
        };
    }
    mapGameApiLogs(logs) {
        return this.dedupeByTimestampAndMessage(logs
            .filter((log) => /\/GameAPI\/(bet|win|refund|adjusted)/i.test(this.getMessage(log)))
            .map((log) => ({
            timestamp: this.getTimestamp(log),
            app: this.getApp(log),
            message: this.getMessage(log),
            raw: log,
        })));
    }
    mapPlatformLogs(logs) {
        return this.dedupeByTimestampAndMessage(logs
            .map((log) => {
            const message = this.getMessage(log);
            const parsedMessageJson = this.extractJsonFromMessage(message);
            const serviceMethod = this.readFirst(log, [
                'serviceMethod',
                'responseLog.serviceMethod',
                'requestLog.serviceMethod',
            ]) ||
                this.readFirst(parsedMessageJson, ['serviceMethod']);
            const stage = this.readFirst(log, [
                'stage',
                'responseLog.stage',
                'requestLog.stage',
            ]) ||
                this.readFirst(parsedMessageJson, [
                    'stage',
                    'httpMethod',
                    'responseLog.stage',
                    'requestLog.stage',
                ]);
            const error = this.readFirst(log, [
                'error',
                'responseLog.error',
                'requestLog.error',
            ]) ||
                this.readFirst(parsedMessageJson, [
                    'error',
                    'responseLog.error',
                    'requestLog.error',
                    'responseLog.description',
                    'httpErrorCode',
                ]);
            return {
                timestamp: this.getTimestamp(log),
                app: this.getApp(log),
                serviceMethod,
                stage,
                error,
                message: this.pickPlatformMessage(log),
                raw: log,
            };
        })
            .filter((log) => Boolean(log.serviceMethod)));
    }
    mapGameLogs(logs) {
        return this.dedupeByTimestampAndMessage(logs.map((log) => ({
            timestamp: this.getTimestamp(log),
            app: this.getApp(log),
            serviceName: this.readFirst(log, ['serviceName', 'service', 'app']),
            logLevel: this.readFirst(log, ['log.level', 'logLevel']),
            message: this.getMessage(log),
            raw: log,
        })));
    }
    pickPlatformMessage(log) {
        const values = [
            this.getMessage(log),
            this.readFirst(log, ['responseLog.description']),
            this.readFirst(log, ['responseLog.message']),
            this.readFirst(log, ['requestLog.message']),
            this.readFirst(log, ['responseLog']),
            this.readFirst(log, ['requestLog']),
        ].filter(Boolean);
        return String(values[0] ?? '');
    }
    extractJsonFromMessage(message) {
        try {
            if (!message || !message.includes('|JSON|')) {
                return {};
            }
            const jsonPart = message.split('|JSON|')[1]?.trim();
            if (!jsonPart) {
                return {};
            }
            return JSON.parse(jsonPart);
        }
        catch {
            return {};
        }
    }
    getTimestamp(log) {
        return String(log?.['@timestamp'] ?? log?.timestamp ?? '');
    }
    getApp(log) {
        return String(log?.app ?? log?.serviceName ?? log?.service ?? '');
    }
    getMessage(log) {
        return String(log?.message ?? '');
    }
    readFirst(obj, paths) {
        for (const path of paths) {
            const value = path.split('.').reduce((acc, key) => acc?.[key], obj);
            if (value !== undefined && value !== null && `${value}`.trim() !== '') {
                return String(value);
            }
        }
        return '';
    }
    dedupeByTimestampAndMessage(items) {
        const seen = new Set();
        const result = [];
        for (const item of items) {
            const key = `${item.timestamp}__${item.message}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            result.push(item);
        }
        return result;
    }
};
exports.PlayerBetLogsService = PlayerBetLogsService;
exports.PlayerBetLogsService = PlayerBetLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [player_bet_logs_repository_1.PlayerBetLogsRepository])
], PlayerBetLogsService);
//# sourceMappingURL=player-bet-logs.service.js.map