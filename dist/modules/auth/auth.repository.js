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
exports.AuthRepository = void 0;
const common_1 = require("@nestjs/common");
const sql = require("mssql");
const database_service_1 = require("../../database/database.service");
let AuthRepository = class AuthRepository {
    constructor(database) {
        this.database = database;
    }
    async findByEmail(emailAddress) {
        const schema = this.database.dbenv;
        const identifier = (emailAddress ?? '').trim();
        const result = await this.database.query((request) => request.input('email_address', sql.VarChar(200), identifier), `
      IF OBJECT_ID('${schema}.casinouser') IS NULL
      BEGIN
        SELECT
          CAST(NULL AS VARCHAR(100)) AS userId,
          CAST(NULL AS VARCHAR(100)) AS emailAddress,
          CAST(NULL AS VARCHAR(200)) AS screenName,
          CAST(NULL AS VARCHAR(100)) AS casinoId,
          CAST(NULL AS VARCHAR(255)) AS passhash,
          'Required table not found' AS status;
        RETURN;
      END;
 
      SELECT TOP 1
        cu.user_id AS userId,
        cu.email_address AS emailAddress,
        cu.screen_name AS screenName,
        cu.casino_id AS casinoId,
        cu.passhash AS passhash,
        'FOUND' AS status
      FROM ${schema}.casinouser cu WITH (NOLOCK)
      WHERE cu.email_address = @email_address;
      `);
        return result.recordset?.[0] ?? null;
    }
};
exports.AuthRepository = AuthRepository;
exports.AuthRepository = AuthRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AuthRepository);
//# sourceMappingURL=auth.repository.js.map