"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const audit_log_module_1 = require("../audit-log/audit-log.module");
const round_controller_1 = require("./round.controller");
const round_repository_1 = require("./round.repository");
const round_service_1 = require("./round.service");
let RoundModule = class RoundModule {
};
exports.RoundModule = RoundModule;
exports.RoundModule = RoundModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, audit_log_module_1.AuditLogModule],
        controllers: [round_controller_1.RoundController],
        providers: [round_service_1.RoundService, round_repository_1.RoundRepository],
    })
], RoundModule);
//# sourceMappingURL=round.module.js.map