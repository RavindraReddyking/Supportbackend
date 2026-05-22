"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./database/database.module");
const audit_log_module_1 = require("./modules/audit-log/audit-log.module");
const auth_module_1 = require("./modules/auth/auth.module");
const casino_module_1 = require("./modules/casino/casino.module");
const health_module_1 = require("./modules/health/health.module");
const player_bets_module_1 = require("./modules/player-bets/player-bets.module");
const round_module_1 = require("./modules/round/round.module");
const user_management_module_1 = require("./modules/user-management/user-management.module");
const player_bet_logs_module_1 = require("./modules/player-bet-logs/player-bet-logs.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            health_module_1.HealthModule,
            audit_log_module_1.AuditLogModule,
            auth_module_1.AuthModule,
            round_module_1.RoundModule,
            player_bets_module_1.PlayerBetsModule,
            player_bet_logs_module_1.PlayerBetLogsModule,
            casino_module_1.CasinoModule,
            user_management_module_1.UserManagementModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map