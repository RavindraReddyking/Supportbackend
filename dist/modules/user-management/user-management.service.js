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
exports.UserManagementService = void 0;
const common_1 = require("@nestjs/common");
const user_management_repository_1 = require("./user-management.repository");
let UserManagementService = class UserManagementService {
    constructor(repository) {
        this.repository = repository;
    }
    async findByEmail(emailAddress) {
        const rows = await this.repository.findByEmail(emailAddress);
        return {
            success: true,
            api: 'user-management/search',
            count: rows.length,
            data: rows,
        };
    }
    async findByUserId(userId) {
        const rows = await this.repository.findByUserId(userId);
        return {
            success: true,
            api: 'user-management/search',
            count: rows.length,
            data: rows,
        };
    }
    async findUser(emailAddress, userId) {
        const rows = await this.repository.findUser(emailAddress, userId);
        return {
            success: true,
            api: 'user-management/search',
            count: rows.length,
            data: rows,
        };
    }
};
exports.UserManagementService = UserManagementService;
exports.UserManagementService = UserManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_management_repository_1.UserManagementRepository])
], UserManagementService);
//# sourceMappingURL=user-management.service.js.map