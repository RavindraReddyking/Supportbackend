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
exports.AuthService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const session_store_service_1 = require("./session-store/session-store.service");
const auth_repository_1 = require("./auth.repository");
let AuthService = class AuthService {
    constructor(config, sessionStore, authRepository) {
        this.config = config;
        this.sessionStore = sessionStore;
        this.authRepository = authRepository;
    }
    getCookieName() {
        return this.config.get('COOKIE_NAME', 'JSESSIONID');
    }
    getIdleTimeoutMs() {
        return this.config.get('SESSION_IDLE_TIMEOUT_MS', 3600000);
    }
    getSessionStoreKind() {
        return this.sessionStore.kind();
    }
    isProduction() {
        return this.config.get('NODE_ENV', 'development') === 'production';
    }
    getCookieSecure() {
        const value = this.config.get('COOKIE_SECURE');
        if (typeof value === 'string' && value.trim() !== '') {
            return value.trim().toLowerCase() === 'true';
        }
        return this.isProduction();
    }
    getCookieSameSite() {
        const value = (this.config.get('COOKIE_SAMESITE', 'lax') || 'lax')
            .trim()
            .toLowerCase();
        if (value === 'none')
            return 'none';
        if (value === 'strict')
            return 'strict';
        return 'lax';
    }
    getCookieDomain() {
        const value = (this.config.get('COOKIE_DOMAIN', '') || '').trim();
        return value || undefined;
    }
    getCookieOptions() {
        const domain = this.getCookieDomain();
        return {
            httpOnly: true,
            sameSite: this.getCookieSameSite(),
            secure: this.getCookieSecure(),
            path: '/',
            signed: true,
            maxAge: this.getIdleTimeoutMs(),
        };
    }
    getMockUser() {
        const adminEmail = this.getAdminEmails()[0] ||
            this.config.get('AUTH_MOCK_EMAIL', 'ravindra.munnangi@arrise.co');
        return {
            email: adminEmail,
            name: this.config.get('AUTH_MOCK_NAME', 'Ravindra Munnangi'),
            role: this.isAdminEmail(adminEmail) ? 'ADMIN' : 'USER',
        };
    }
    getAdminEmails() {
        return (this.config.get('AUTH_ADMIN_USERS', '') || '')
            .split(',')
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);
    }
    isAdminEmail(email) {
        return this.getAdminEmails().includes((email || '').trim().toLowerCase());
    }
    hashPassword(password) {
        return (0, crypto_1.createHash)('sha1').update(password, 'utf8').digest('hex').toLowerCase();
    }
    async validatePortalUser(email, password) {
        const identifier = (email || '').trim();
        const user = await this.authRepository.findByEmail(identifier);
        if (!user?.emailAddress || !user?.passhash) {
            return null;
        }
        const hashedInput = this.hashPassword((password || '').trim());
        if (hashedInput !== String(user.passhash).trim().toLowerCase()) {
            return null;
        }
        const normalizedEmail = user.emailAddress?.trim().toLowerCase();
        return {
            email: normalizedEmail || user.screenName?.trim() || identifier,
            name: user.screenName?.trim() || normalizedEmail || identifier,
            role: this.isAdminEmail(normalizedEmail) ? 'ADMIN' : 'USER',
        };
    }
    getSignedToken(request) {
        const cookieName = this.getCookieName();
        const signed = request.signedCookies?.[cookieName];
        if (typeof signed === 'string' && signed.trim()) {
            return signed.trim();
        }
        const fallback = request.cookies?.[cookieName];
        return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : null;
    }
    async resolveSessionFromRequest(request, touch) {
        const token = this.getSignedToken(request);
        if (!token)
            return null;
        const session = await this.sessionStore.get(token);
        if (!session)
            return null;
        if (session.expiresAt <= Date.now()) {
            await this.sessionStore.delete(token);
            return null;
        }
        if (touch) {
            return this.sessionStore.touch(session, this.getIdleTimeoutMs());
        }
        return session;
    }
    async createSession(user) {
        const now = Date.now();
        const session = {
            token: (0, crypto_1.randomUUID)(),
            user,
            createdAt: now,
            lastActivityAt: now,
            expiresAt: now + this.getIdleTimeoutMs(),
        };
        await this.sessionStore.set(session);
        return session;
    }
    attachSessionCookie(response, session) {
        response.cookie(this.getCookieName(), session.token, this.getCookieOptions());
    }
    async clearSession(response, request) {
        const token = request ? this.getSignedToken(request) : null;
        if (token) {
            await this.sessionStore.delete(token);
        }
        response.clearCookie(this.getCookieName(), this.getCookieOptions());
    }
    getAzureAuthorizeUrl(returnTo) {
        const tenantId = this.config.get('AZURE_TENANT_ID', '');
        const clientId = this.config.get('AZURE_CLIENT_ID', '');
        const redirectUri = this.config.get('AZURE_REDIRECT_URI', '');
        const state = Buffer.from(JSON.stringify({ returnTo: returnTo || '/home' }), 'utf8').toString('base64url');
        if (!tenantId || !clientId || !redirectUri) {
            const callbackUrl = `${this.getBackendBaseUrl()}/api/auth/azure/callback`;
            return `${callbackUrl}?state=${encodeURIComponent(state)}`;
        }
        const base = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
        const params = new URLSearchParams({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            response_mode: 'query',
            scope: 'openid profile email',
            state,
        });
        return `${base}?${params.toString()}`;
    }
    parseReturnTo(rawState) {
        if (!rawState)
            return '/home';
        try {
            const decoded = JSON.parse(Buffer.from(rawState, 'base64url').toString('utf8'));
            return typeof decoded.returnTo === 'string' && decoded.returnTo.startsWith('/')
                ? decoded.returnTo
                : '/home';
        }
        catch {
            return '/home';
        }
    }
    getFrontendBaseUrl() {
        return this.config.get('FRONTEND_URL', 'http://localhost:3000').replace(/\/$/, '');
    }
    getBackendBaseUrl() {
        return this.config.get('BACKEND_URL', 'http://localhost:3001').replace(/\/$/, '');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        session_store_service_1.SessionStoreService,
        auth_repository_1.AuthRepository])
], AuthService);
//# sourceMappingURL=auth.service.js.map