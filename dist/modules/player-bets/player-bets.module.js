"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerBetsModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const audit_log_module_1 = require("../audit-log/audit-log.module");
const player_bets_controller_1 = require("./player-bets.controller");
const player_bets_repository_1 = require("./player-bets.repository");
const player_bets_service_1 = require("./player-bets.service");
let PlayerBetsModule = class PlayerBetsModule {
};
exports.PlayerBetsModule = PlayerBetsModule;
exports.PlayerBetsModule = PlayerBetsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, audit_log_module_1.AuditLogModule],
        controllers: [player_bets_controller_1.PlayerBetsController],
        providers: [player_bets_service_1.PlayerBetsService, player_bets_repository_1.PlayerBetsRepository],
    })
], PlayerBetsModule);
//# sourceMappingURL=player-bets.module.js.map