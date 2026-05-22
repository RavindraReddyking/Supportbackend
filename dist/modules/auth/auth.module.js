"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const audit_log_module_1 = require("../audit-log/audit-log.module");
const database_module_1 = require("../../database/database.module");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const session_auth_guard_1 = require("./session-auth.guard");
const memory_session_store_1 = require("./session-store/memory-session.store");
const redis_session_store_1 = require("./session-store/redis-session.store");
const session_store_service_1 = require("./session-store/session-store.service");
const auth_repository_1 = require("./auth.repository");
const roles_guard_1 = require("./roles.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_log_module_1.AuditLogModule, database_module_1.DatabaseModule],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            memory_session_store_1.MemorySessionStore,
            redis_session_store_1.RedisSessionStore,
            session_store_service_1.SessionStoreService,
            auth_repository_1.AuthRepository,
            {
                provide: core_1.APP_GUARD,
                useClass: session_auth_guard_1.SessionAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
        exports: [auth_service_1.AuthService, session_store_service_1.SessionStoreService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map