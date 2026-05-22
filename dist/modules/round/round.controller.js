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
exports.RoundController = void 0;
const common_1 = require("@nestjs/common");
const lookup_dto_1 = require("../../common/dto/lookup.dto");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const round_service_1 = require("./round.service");
let RoundController = class RoundController {
    constructor(roundService, auditLogService) {
        this.roundService = roundService;
        this.auditLogService = auditLogService;
    }
    async getBetTable(dto, request) {
        const normalized = dto.normalized();
        const response = await this.roundService.getBetTable(normalized);
        this.auditLogService.capture(request, {
            action: 'BET_LIFECYCLE_SEARCH',
            entityType: 'bet-table',
            entityValue: normalized.roundId || `${normalized.gameId}|${normalized.userId}`,
            status: 'SUCCESS',
            metadata: { target: 'bettableinfo' },
        });
        return response;
    }
    async getTptTable(dto, request) {
        const normalized = dto.normalized();
        const response = await this.roundService.getTptTable(normalized);
        this.auditLogService.capture(request, {
            action: 'BET_LIFECYCLE_SEARCH',
            entityType: 'tpt-table',
            entityValue: normalized.roundId || `${normalized.gameId}|${normalized.userId}`,
            status: 'SUCCESS',
            metadata: { target: 'tpttableinfo' },
        });
        return response;
    }
    async getCardDetails(dto, request) {
        const normalized = dto.normalized();
        const response = await this.roundService.getCardDetails(normalized);
        this.auditLogService.capture(request, {
            action: 'BET_LIFECYCLE_SEARCH',
            entityType: 'card-details',
            entityValue: normalized.roundId || `${normalized.gameId}|${normalized.userId}`,
            status: 'SUCCESS',
            metadata: { target: 'carddetails' },
        });
        return response;
    }
    async getGameDetails(dto, request) {
        const normalized = dto.normalized();
        const response = await this.roundService.getGameDetails(normalized);
        this.auditLogService.capture(request, {
            action: 'BET_LIFECYCLE_SEARCH',
            entityType: 'game-details',
            entityValue: normalized.roundId || `${normalized.gameId}|${normalized.userId}`,
            status: 'SUCCESS',
            metadata: { target: 'gamedetails' },
        });
        return response;
    }
};
exports.RoundController = RoundController;
__decorate([
    (0, common_1.Get)('bettableinfo'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lookup_dto_1.RoundLookupDto, Object]),
    __metadata("design:returntype", Promise)
], RoundController.prototype, "getBetTable", null);
__decorate([
    (0, common_1.Get)('tpttableinfo'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lookup_dto_1.RoundLookupDto, Object]),
    __metadata("design:returntype", Promise)
], RoundController.prototype, "getTptTable", null);
__decorate([
    (0, common_1.Get)('carddetails'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lookup_dto_1.RoundLookupDto, Object]),
    __metadata("design:returntype", Promise)
], RoundController.prototype, "getCardDetails", null);
__decorate([
    (0, common_1.Get)('gamedetails'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lookup_dto_1.RoundLookupDto, Object]),
    __metadata("design:returntype", Promise)
], RoundController.prototype, "getGameDetails", null);
exports.RoundController = RoundController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [round_service_1.RoundService,
        audit_log_service_1.AuditLogService])
], RoundController);
//# sourceMappingURL=round.controller.js.map