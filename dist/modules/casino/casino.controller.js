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
exports.CasinoController = void 0;
const common_1 = require("@nestjs/common");
const lookup_dto_1 = require("../../common/dto/lookup.dto");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const casino_service_1 = require("./casino.service");
let CasinoController = class CasinoController {
    constructor(casinoService, auditLogService) {
        this.casinoService = casinoService;
        this.auditLogService = auditLogService;
    }
    async getDetails(dto, request) {
        if (!dto.casinoid || !dto.casinoid.trim()) {
            return {
                success: false,
                message: 'casinoid is required',
            };
        }
        const response = await this.casinoService.getDetails(dto.casinoid);
        this.auditLogService.capture(request, {
            action: 'CASINO_CONFIG_SEARCH',
            entityType: 'casino-config',
            entityValue: dto.casinoid,
            status: response.data.casino ? 'SUCCESS' : 'NOT_FOUND',
        });
        return response;
    }
    async getLCEnabledTables(dto, request) {
        if (!dto.casinoid || !dto.casinoid.trim()) {
            return {
                success: false,
                message: 'casinoid is required',
            };
        }
        const response = await this.casinoService.getLCEnabledTables(dto.casinoid);
        this.auditLogService.capture(request, {
            action: 'LC_ENABLED_TABLES_SEARCH',
            entityType: 'casino-config',
            entityValue: dto.casinoid,
            status: response.data?.length ? 'SUCCESS' : 'NOT_FOUND',
        });
        return response;
    }
};
exports.CasinoController = CasinoController;
__decorate([
    (0, common_1.Get)('casinodetails'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lookup_dto_1.CasinoLookupDto, Object]),
    __metadata("design:returntype", Promise)
], CasinoController.prototype, "getDetails", null);
__decorate([
    (0, common_1.Get)('lc-enabled-tables'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lookup_dto_1.CasinoLookupDto, Object]),
    __metadata("design:returntype", Promise)
], CasinoController.prototype, "getLCEnabledTables", null);
exports.CasinoController = CasinoController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [casino_service_1.CasinoService,
        audit_log_service_1.AuditLogService])
], CasinoController);
//# sourceMappingURL=casino.controller.js.map