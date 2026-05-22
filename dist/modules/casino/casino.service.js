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
exports.CasinoService = void 0;
const common_1 = require("@nestjs/common");
const casino_repository_1 = require("./casino.repository");
let CasinoService = class CasinoService {
    constructor(repository) {
        this.repository = repository;
    }
    async getDetails(casinoId) {
        const result = await this.repository.getCasinoDetails(casinoId);
        const main = result.recordsets[0]?.[0] || null;
        const shared = result.recordsets[1] || [];
        return {
            success: true,
            api: 'casinodetails',
            data: {
                casino: main,
                shared_envs: shared,
            },
        };
    }
    async getLCEnabledTables(casinoId) {
        const result = await this.repository.getLCEnabledTables(casinoId);
        return {
            success: true,
            api: 'lc-enabled-tables',
            count: result.recordset.length,
            data: result.recordset,
        };
    }
};
exports.CasinoService = CasinoService;
exports.CasinoService = CasinoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [casino_repository_1.CasinoRepository])
], CasinoService);
//# sourceMappingURL=casino.service.js.map