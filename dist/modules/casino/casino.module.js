"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasinoModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const audit_log_module_1 = require("../audit-log/audit-log.module");
const casino_controller_1 = require("./casino.controller");
const casino_repository_1 = require("./casino.repository");
const casino_service_1 = require("./casino.service");
let CasinoModule = class CasinoModule {
};
exports.CasinoModule = CasinoModule;
exports.CasinoModule = CasinoModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, audit_log_module_1.AuditLogModule],
        controllers: [casino_controller_1.CasinoController],
        providers: [casino_service_1.CasinoService, casino_repository_1.CasinoRepository],
    })
], CasinoModule);
//# sourceMappingURL=casino.module.js.map