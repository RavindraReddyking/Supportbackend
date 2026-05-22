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
exports.UserManagementRepository = void 0;
const common_1 = require("@nestjs/common");
const sql = require("mssql");
const database_service_1 = require("../../database/database.service");
let UserManagementRepository = class UserManagementRepository {
    constructor(database) {
        this.database = database;
    }
    async findUser(emailAddress, userId) {
        const schema = this.database.schema;
        const normalizedEmail = (emailAddress ?? '').trim();
        const normalizedUserId = (userId ?? '').trim();
        if (!normalizedEmail && !normalizedUserId) {
            return [];
        }
        const emailParam = normalizedEmail || null;
        const userIdParam = normalizedUserId || null;
        const result = await this.database.query((request) => request
            .input('EmailAddress', sql.VarChar(100), emailParam)
            .input('UserId', sql.Char(16), userIdParam), `
        EXEC ${schema}.usp_GetPlayerInfo
            @EmailAddress = @EmailAddress,
            @UserId       = @UserId;
      `);
        return result.recordset ?? [];
    }
    async findByEmail(emailAddress) {
        return this.findUser(emailAddress, undefined);
    }
    async findByUserId(userId) {
        return this.findUser(undefined, userId);
    }
    async findByUserIdAndEmail(userId, emailAddress) {
        return this.findUser(emailAddress, userId);
    }
};
exports.UserManagementRepository = UserManagementRepository;
exports.UserManagementRepository = UserManagementRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UserManagementRepository);
//# sourceMappingURL=user-management.repository.js.map