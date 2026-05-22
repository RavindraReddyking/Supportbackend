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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerBetLogsController = void 0;
const common_1 = require("@nestjs/common");
const player_bet_logs_service_1 = require("./player-bet-logs.service");
let PlayerBetLogsController = class PlayerBetLogsController {
    constructor(service) {
        this.service = service;
    }
    async getPlayerBetLogs(roundId, gameId, userId, from, to) {
        return this.service.getPlayerBetLogs({
            roundId: roundId ?? '',
            gameId: gameId ?? '',
            userId: userId ?? '',
            from: from ?? '',
            to: to ?? '',
        });
    }
    async getTransactionLogs(roundId, from, to) {
        return this.service.getTransactionLogs({
            roundId: roundId ?? '',
            from: from ?? '',
            to: to ?? '',
        });
    }
    async getGameLogs(gameId, userId, gameType, from, to) {
        return this.service.getGameLogs({
            gameId: gameId ?? '',
            userId: userId ?? '',
            gameType: (gameType ?? 'GENERIC'),
            from: from ?? '',
            to: to ?? '',
        });
    }
};
exports.PlayerBetLogsController = PlayerBetLogsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('roundId')),
    __param(1, (0, common_1.Query)('gameId')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('from')),
    __param(4, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PlayerBetLogsController.prototype, "getPlayerBetLogs", null);
__decorate([
    (0, common_1.Get)('transactionlogs'),
    __param(0, (0, common_1.Query)('roundId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PlayerBetLogsController.prototype, "getTransactionLogs", null);
__decorate([
    (0, common_1.Get)('gamelogs'),
    __param(0, (0, common_1.Query)('gameId')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('gameType')),
    __param(3, (0, common_1.Query)('from')),
    __param(4, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PlayerBetLogsController.prototype, "getGameLogs", null);
exports.PlayerBetLogsController = PlayerBetLogsController = __decorate([
    (0, common_1.Controller)('playerbetlogs'),
    __metadata("design:paramtypes", [player_bet_logs_service_1.PlayerBetLogsService])
], PlayerBetLogsController);
//# sourceMappingURL=player-bet-logs.controller.js.map