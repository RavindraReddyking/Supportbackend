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
exports.RoundService = void 0;
const common_1 = require("@nestjs/common");
const round_lookup_1 = require("../../common/lookup/round-lookup");
const round_repository_1 = require("./round.repository");
let RoundService = class RoundService {
    constructor(repository) {
        this.repository = repository;
    }
    validate(params) {
        (0, round_lookup_1.resolveRoundLookupMode)(params);
    }
    buildDisplayDescription(row) {
        const description = String(row?.description ?? '').trim();
        if (!description) {
            return '';
        }
        return description.replace(/\bseat\s+(\d+)\b/i, (_match, seatValue) => {
            const dbSeat = Number(seatValue);
            if (Number.isNaN(dbSeat)) {
                return `seat ${seatValue}`;
            }
            const uiSeat = 8 - dbSeat;
            return `seat ${uiSeat}`;
        });
    }
    mapBetTableRows(rows) {
        return (rows ?? []).map((row) => ({
            ...row,
            displayDescription: this.buildDisplayDescription(row),
        }));
    }
    async getBetTable(params) {
        this.validate(params);
        const result = await this.repository.getBetTable(params);
        const mappedRows = this.mapBetTableRows(result.recordset);
        return {
            success: true,
            api: 'bettableinfo',
            mode: params.roundId ? 'RoundId' : 'GameIdUserId',
            count: mappedRows.length,
            data: mappedRows,
        };
    }
    async getTptTable(params) {
        this.validate(params);
        const result = await this.repository.getTptTable(params);
        return {
            success: true,
            api: 'tpttableinfo',
            mode: params.roundId ? 'RoundId' : 'GameIdUserId',
            count: result.recordset.length,
            data: result.recordset,
        };
    }
    async getCardDetails(params) {
        this.validate(params);
        const result = await this.repository.getCardDetails(params);
        return {
            success: true,
            api: 'carddetails',
            mode: params.roundId ? 'RoundId' : 'GameIdUserId',
            count: result.recordset.length,
            data: result.recordset,
        };
    }
    async getGameDetails(params) {
        this.validate(params);
        const result = await this.repository.getGameDetails(params);
        return {
            success: true,
            api: 'gamedetails',
            mode: params.roundId ? 'RoundId' : 'GameIdUserId',
            count: result.recordset.length,
            data: result.recordset,
        };
    }
};
exports.RoundService = RoundService;
exports.RoundService = RoundService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [round_repository_1.RoundRepository])
], RoundService);
//# sourceMappingURL=round.service.js.map