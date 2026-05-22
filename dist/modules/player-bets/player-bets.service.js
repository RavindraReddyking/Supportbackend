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
exports.PlayerBetsService = void 0;
const common_1 = require("@nestjs/common");
const player_bets_repository_1 = require("./player-bets.repository");
let PlayerBetsService = class PlayerBetsService {
    constructor(repository) {
        this.repository = repository;
    }
    async getInfo(dto) {
        const fromDate = new Date(dto.StartTime);
        const toDate = new Date(dto.EndTime);
        const diff = toDate.getTime() - fromDate.getTime();
        const result = await this.repository.getPlayerBets(dto.UserId, fromDate, toDate);
        const rows = result.recordsets[0] || [];
        return {
            success: true,
            api: 'playerbetsinfo',
            count: rows.length,
            data: rows,
        };
    }
};
exports.PlayerBetsService = PlayerBetsService;
exports.PlayerBetsService = PlayerBetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [player_bets_repository_1.PlayerBetsRepository])
], PlayerBetsService);
//# sourceMappingURL=player-bets.service.js.map