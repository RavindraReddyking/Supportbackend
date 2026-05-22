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
exports.RoundRepository = void 0;
const common_1 = require("@nestjs/common");
const round_lookup_1 = require("../../common/lookup/round-lookup");
const database_service_1 = require("../../database/database.service");
let RoundRepository = class RoundRepository {
    constructor(database) {
        this.database = database;
    }
    async getBetTable(params) {
        const schema = this.database.schema;
        const mode = (0, round_lookup_1.resolveRoundLookupMode)(params);
        return this.database.query((request) => (0, round_lookup_1.configureRoundLookupRequest)(request, params), mode === 'RoundId'
            ? `
          EXEC ${schema}.usp_GetBetData
          @RoundId = @RoundId
        `
            : `
          EXEC ${schema}.usp_GetBetData
          @GameId = @GameId,
          @UserId = @UserId
        `);
    }
    async getTptTable(params) {
        const schema = this.database.schema;
        const mode = (0, round_lookup_1.resolveRoundLookupMode)(params);
        return this.database.query((request) => (0, round_lookup_1.configureRoundLookupRequest)(request, params), mode === 'RoundId'
            ? `
          EXEC ${schema}.usp_GetThirdPartyTxnData
          @RoundId = @RoundId
        `
            : `
         EXEC ${schema}.usp_GetThirdPartyTxnData
          @GameId = @GameId,
          @UserId = @UserId
        `);
    }
    async getCardDetails(params) {
        const schema = this.database.schema;
        const mode = (0, round_lookup_1.resolveRoundLookupMode)(params);
        return this.database.query((request) => (0, round_lookup_1.configureRoundLookupRequest)(request, params), mode === 'RoundId'
            ? `
          EXEC ${schema}.usp_GetGameDetailsCG
          @RoundId = @RoundId
        `
            : `
          EXEC ${schema}.usp_GetGameDetailsCG
          @GameId = @GameId,
          @UserId = @UserId
        `);
    }
    async getGameDetails(params) {
        const schema = this.database.schema;
        const mode = (0, round_lookup_1.resolveRoundLookupMode)(params);
        if (mode === 'RoundId') {
            return this.database.query((request) => (0, round_lookup_1.configureRoundLookupRequest)(request, params), `
          EXEC ${schema}.usp_GetTableGameDetails
          @RoundId = @RoundId
        `);
        }
        return this.database.query((request) => (0, round_lookup_1.configureRoundLookupRequest)(request, params), `
        EXEC ${schema}.usp_GetTableGameDetails
          @GameId = @GameId,
          @UserId = @UserId
      `);
    }
};
exports.RoundRepository = RoundRepository;
exports.RoundRepository = RoundRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RoundRepository);
//# sourceMappingURL=round.repository.js.map