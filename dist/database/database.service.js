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
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sql = require("mssql");
let DatabaseService = class DatabaseService {
    constructor(config) {
        this.config = config;
        this.poolPromise = null;
    }
    get dbenv() {
        return this.config.get('dbenv', 'prelive0.dbo');
    }
    get schema() {
        return this.config.get('DB_SCHEMA', 'prelive0.dbo');
    }
    getConnectionConfig() {
        return {
            server: this.config.get('DB_SERVER', 'localhost'),
            port: Number(this.config.get('DB_PORT', '1433')),
            user: this.config.get('DB_USER', ''),
            password: this.config.get('DB_PASSWORD', ''),
            database: this.config.get('DB_NAME', 'prelive0'),
            options: {
                encrypt: this.config.get('DB_ENCRYPT', 'false') === 'true',
                trustServerCertificate: true,
            },
        };
    }
    async getPool() {
        if (!this.poolPromise) {
            this.poolPromise = new sql.ConnectionPool(this.getConnectionConfig()).connect();
        }
        return this.poolPromise;
    }
    async query(configure, query) {
        const pool = await this.getPool();
        const request = configure(pool.request());
        return request.query(query);
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map