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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
let AuthController = class AuthController {
    constructor(authService, auditLogService) {
        this.authService = authService;
        this.auditLogService = auditLogService;
    }
    async getSession(request, response) {
        const session = await this.authService.resolveSessionFromRequest(request, true);
        if (!session) {
            await this.authService.clearSession(response, request);
            return {
                success: false,
                api: '/api/auth/session',
                authenticated: false,
                error: 'Session expired. Please log in again.',
                sessionStore: this.authService.getSessionStoreKind(),
            };
        }
        this.authService.attachSessionCookie(response, session);
        return {
            success: true,
            api: '/api/auth/session',
            authenticated: true,
            idleTimeoutMinutes: 60,
            user: session.user,
            sessionStore: this.authService.getSessionStoreKind(),
        };
    }
    async loginWithPassword(body, request, response) {
        const user = await this.authService.validatePortalUser(body.email, body.password);
        if (!user) {
            this.auditLogService.capture(request, {
                action: 'LOGIN',
                entityType: 'auth',
                entityValue: body.email,
                status: 'FAILED',
                metadata: { provider: 'password', reason: 'INVALID_CREDENTIALS' },
            });
            throw new common_1.UnauthorizedException({
                success: false,
                api: '/api/auth/login',
                error: 'Invalid email or password.',
            });
        }
        const session = await this.authService.createSession(user);
        this.authService.attachSessionCookie(response, session);
        this.auditLogService.capture(request, {
            action: 'LOGIN',
            entityType: 'auth',
            entityValue: session.user.email,
            status: 'SUCCESS',
            metadata: {
                provider: 'password',
                mode: 'session-cookie',
                sessionStore: this.authService.getSessionStoreKind(),
                role: session.user.role,
            },
        });
        return {
            success: true,
            api: '/api/auth/login',
            authenticated: true,
            user: session.user,
            sessionStore: this.authService.getSessionStoreKind(),
        };
    }
    login(response, returnTo) {
        const safeReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/home';
        return response.redirect(this.authService.getAzureAuthorizeUrl(safeReturnTo));
    }
    async callback(request, response) {
        const session = await this.authService.createSession(this.authService.getMockUser());
        this.authService.attachSessionCookie(response, session);
        this.auditLogService.capture(request, {
            action: 'LOGIN',
            entityType: 'auth',
            entityValue: session.user.email,
            status: 'SUCCESS',
            metadata: {
                provider: 'azure',
                mode: 'session-cookie',
                sessionStore: this.authService.getSessionStoreKind(),
            },
        });
        const returnTo = this.authService.parseReturnTo(request.query?.state?.toString());
        return response.redirect(`${this.authService.getFrontendBaseUrl()}${returnTo}`);
    }
    async logout(request, response) {
        const session = await this.authService.resolveSessionFromRequest(request, false);
        if (session) {
            this.auditLogService.capture(request, {
                action: 'LOGOUT',
                entityType: 'auth',
                entityValue: session.user.email,
                status: 'SUCCESS',
            });
        }
        await this.authService.clearSession(response, request);
        return response.redirect(this.authService.getFrontendBaseUrl());
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('session'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getSession", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('azure/login'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('returnTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('azure/callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "callback", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        audit_log_service_1.AuditLogService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map