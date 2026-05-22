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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManagementController = void 0;
const common_1 = require("@nestjs/common");
const user_management_service_1 = require("./user-management.service");
let UserManagementController = class UserManagementController {
    constructor(service) {
        this.service = service;
    }
    async searchUser(emailAddress, userId) {
        if (!emailAddress && !userId) {
            return {
                success: false,
                message: 'Either emailAddress or userId is required',
            };
        }
        if (emailAddress && userId) {
            return {
                success: false,
                message: 'Send only one: emailAddress OR userId, not both',
            };
        }
        if (emailAddress) {
            return this.service.findByEmail(emailAddress);
        }
        return this.service.findByUserId(userId);
    }
};
exports.UserManagementController = UserManagementController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('emailAddress')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserManagementController.prototype, "searchUser", null);
exports.UserManagementController = UserManagementController = __decorate([
    (0, common_1.Controller)('user-management'),
    __metadata("design:paramtypes", [user_management_service_1.UserManagementService])
], UserManagementController);
//# sourceMappingURL=user-management.controller.js.map