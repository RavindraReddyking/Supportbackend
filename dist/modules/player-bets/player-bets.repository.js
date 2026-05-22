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
exports.PlayerBetsRepository = void 0;
const common_1 = require("@nestjs/common");
const sql = require("mssql");
const database_service_1 = require("../../database/database.service");
let PlayerBetsRepository = class PlayerBetsRepository {
    constructor(database) {
        this.database = database;
    }
    async getPlayerBets(playerId, fromDate, toDate) {
        const schema = this.database.schema;
        const result = await this.database.query((request) => request
            .input('UserId', sql.VarChar(16), playerId.padEnd(16, ' '))
            .input('StartTime', sql.DateTime2, fromDate)
            .input('EndTime', sql.DateTime2, toDate), `
        EXEC ${schema}.usp_PlayerBets
          @UserId = @UserId,
          @StartTime = @StartTime,
          @EndTime = @EndTime
      `);
        return result;
    }
};
exports.PlayerBetsRepository = PlayerBetsRepository;
exports.PlayerBetsRepository = PlayerBetsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PlayerBetsRepository);
//# sourceMappingURL=player-bets.repository.js.map