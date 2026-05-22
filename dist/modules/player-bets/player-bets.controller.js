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
exports.PlayerBetsController = void 0;
const common_1 = require("@nestjs/common");
const lookup_dto_1 = require("../../common/dto/lookup.dto");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const player_bets_service_1 = require("./player-bets.service");
let PlayerBetsController = class PlayerBetsController {
    constructor(playerBetsService, auditLogService) {
        this.playerBetsService = playerBetsService;
        this.auditLogService = auditLogService;
    }
    async getInfo(dto, request) {
        const response = await this.playerBetsService.getInfo(dto);
        this.auditLogService.capture(request, {
            action: 'PLAYER_BETS_SEARCH',
            entityType: 'player-bets',
            entityValue: `${dto.UserId} | ${dto.StartTime} -> ${dto.EndTime}`,
            status: 'SUCCESS',
        });
        return response;
    }
};
exports.PlayerBetsController = PlayerBetsController;
__decorate([
    (0, common_1.Get)('playerbetsinfo'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lookup_dto_1.PlayerRangeDto, Object]),
    __metadata("design:returntype", Promise)
], PlayerBetsController.prototype, "getInfo", null);
exports.PlayerBetsController = PlayerBetsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [player_bets_service_1.PlayerBetsService,
        audit_log_service_1.AuditLogService])
], PlayerBetsController);
//# sourceMappingURL=player-bets.controller.js.map