"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerBetLogsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const player_bet_logs_controller_1 = require("./player-bet-logs.controller");
const player_bet_logs_repository_1 = require("./player-bet-logs.repository");
const player_bet_logs_service_1 = require("./player-bet-logs.service");
let PlayerBetLogsModule = class PlayerBetLogsModule {
};
exports.PlayerBetLogsModule = PlayerBetLogsModule;
exports.PlayerBetLogsModule = PlayerBetLogsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [player_bet_logs_controller_1.PlayerBetLogsController],
        providers: [player_bet_logs_repository_1.PlayerBetLogsRepository, player_bet_logs_service_1.PlayerBetLogsService],
    })
], PlayerBetLogsModule);
//# sourceMappingURL=player-bet-logs.module.js.map